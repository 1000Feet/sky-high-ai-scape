// Auto-starts the daily SMTP campaign at 10:00 AM America/New_York.
// Triggered by pg_cron at both 14:00 UTC (EST) and 15:00 UTC (EDT).
// Function checks the actual New York hour and only proceeds if it's 10.
// Idempotent: will not start if a batch is already running.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getNewYorkHour(): number {
  // Use Intl to get the current hour in America/New_York (handles DST automatically)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
  })
  return parseInt(fmt.format(new Date()), 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Allow ?force=true for manual testing, otherwise enforce 10 AM NY
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === 'true'
    const nyHour = getNewYorkHour()

    if (!force && nyHour !== 10) {
      console.log(`Skipping: NY hour is ${nyHour}, not 10`)
      return new Response(
        JSON.stringify({ skipped: true, reason: `NY hour is ${nyHour}, not 10` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Check if a batch is already running
    const { data: running } = await supabase
      .from('email_batches')
      .select('id')
      .eq('status', 'running')
      .limit(1)
      .maybeSingle()

    if (running) {
      console.log(`Batch ${running.id} already running, skipping`)
      return new Response(
        JSON.stringify({ skipped: true, reason: 'batch already running', batch_id: running.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Check for a paused batch to resume (most recent first)
    const { data: paused } = await supabase
      .from('email_batches')
      .select('id, cursor, total')
      .eq('status', 'paused')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (paused) {
      console.log(`Resuming paused batch ${paused.id} from cursor=${paused.cursor}/${paused.total}`)
      await supabase.from('email_batches').update({
        status: 'running',
        paused_reason: null,
        paused_until: null,
      }).eq('id', paused.id)

      fetch(`${supabaseUrl}/functions/v1/send-campaign-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ batch_id: paused.id }),
      }).catch((e) => console.error('Invoke send-campaign-batch (resume) failed', e))

      return new Response(
        JSON.stringify({ resumed: true, batch_id: paused.id, cursor: paused.cursor, total: paused.total, ny_hour: nyHour }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch uncontacted prospects with valid email — paginate past Supabase 1000-row limit
    const PAGE = 1000
    const allIds: string[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('potential_clients')
        .select('id')
        .eq('contacted', false)
        .not('email', 'is', null)
        .neq('email', '')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      if (!data || data.length === 0) break
      allIds.push(...data.map((r) => r.id))
      if (data.length < PAGE) break
      from += PAGE
    }

    if (allIds.length === 0) {
      console.log('No uncontacted prospects with email')
      return new Response(
        JSON.stringify({ started: false, reason: 'no uncontacted prospects' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Create batch
    const { data: batch, error: bErr } = await supabase
      .from('email_batches')
      .insert({
        status: 'running',
        total: allIds.length,
        prospect_ids: allIds,
      })
      .select()
      .single()

    if (bErr || !batch) throw bErr || new Error('Failed to create batch')

    console.log(`Created batch ${batch.id} with ${allIds.length} prospects, invoking sender`)

    // Fire-and-forget invoke send-campaign-batch
    fetch(`${supabaseUrl}/functions/v1/send-campaign-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ batch_id: batch.id }),
    }).catch((e) => console.error('Invoke send-campaign-batch failed', e))

    return new Response(
      JSON.stringify({ started: true, batch_id: batch.id, total: allIds.length, ny_hour: nyHour }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('auto-start-daily-campaign error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
