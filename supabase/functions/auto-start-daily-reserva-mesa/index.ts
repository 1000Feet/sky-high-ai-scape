// Auto-starts the daily Reserva Mesa (Costa Rica) SMTP campaign.
// Triggered by pg_cron. Idempotent: skips if a batch is already running.
// Schedule it at the desired time in UTC via cron.schedule.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Check if a batch is already running
    const { data: running } = await supabase
      .from('email_batches_reserva_mesa')
      .select('id')
      .eq('status', 'running')
      .limit(1)
      .maybeSingle()

    if (running) {
      console.log(`Reserva Mesa batch ${running.id} already running, skipping`)
      return new Response(
        JSON.stringify({ skipped: true, reason: 'batch already running', batch_id: running.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Resume paused batch if any
    const { data: paused } = await supabase
      .from('email_batches_reserva_mesa')
      .select('id, cursor, total')
      .eq('status', 'paused')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (paused) {
      console.log(`Resuming paused Reserva Mesa batch ${paused.id} from cursor=${paused.cursor}/${paused.total}`)
      await supabase.from('email_batches_reserva_mesa').update({
        status: 'running',
        paused_reason: null,
        paused_until: null,
      }).eq('id', paused.id)

      fetch(`${supabaseUrl}/functions/v1/send-reserva-mesa-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ batch_id: paused.id }),
      }).catch((e) => console.error('Invoke send-reserva-mesa-batch (resume) failed', e))

      return new Response(
        JSON.stringify({ resumed: true, batch_id: paused.id, cursor: paused.cursor, total: paused.total }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch uncontacted prospects with valid email
    const PAGE = 1000
    const allIds: string[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('potential_clients_reserva_mesa')
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
      console.log('No uncontacted Reserva Mesa prospects with email')
      return new Response(
        JSON.stringify({ started: false, reason: 'no uncontacted prospects' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: batch, error: bErr } = await supabase
      .from('email_batches_reserva_mesa')
      .insert({
        status: 'running',
        total: allIds.length,
        prospect_ids: allIds,
      })
      .select()
      .single()

    if (bErr || !batch) throw bErr || new Error('Failed to create batch')

    console.log(`Created Reserva Mesa batch ${batch.id} with ${allIds.length} prospects`)

    fetch(`${supabaseUrl}/functions/v1/send-reserva-mesa-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ batch_id: batch.id }),
    }).catch((e) => console.error('Invoke send-reserva-mesa-batch failed', e))

    return new Response(
      JSON.stringify({ started: true, batch_id: batch.id, total: allIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('auto-start-daily-reserva-mesa error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
