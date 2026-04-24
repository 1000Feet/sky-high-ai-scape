// Watchdog: finds batches that are stuck (running with stale heartbeat)
// or paused (paused_until in the past), and re-invokes send-campaign-batch.
// Scheduled via pg_cron every 5 minutes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STALE_HEARTBEAT_MINUTES = 3

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const nowIso = new Date().toISOString()
  const staleCutoffIso = new Date(
    Date.now() - STALE_HEARTBEAT_MINUTES * 60 * 1000,
  ).toISOString()

  // 1) Stale 'running' batches (heartbeat too old → process likely died)
  const { data: staleRunning } = await supabase
    .from('email_batches')
    .select('id, last_heartbeat_at')
    .eq('status', 'running')
    .lt('last_heartbeat_at', staleCutoffIso)

  // 2) Paused batches whose paused_until has passed
  const { data: readyPaused } = await supabase
    .from('email_batches')
    .select('id, paused_until')
    .eq('status', 'paused')
    .or(`paused_until.is.null,paused_until.lt.${nowIso}`)

  const toResume: { id: string; reason: string }[] = []
  for (const b of staleRunning ?? []) {
    toResume.push({ id: b.id, reason: `stale running (heartbeat ${b.last_heartbeat_at})` })
  }
  for (const b of readyPaused ?? []) {
    toResume.push({ id: b.id, reason: `paused expired (until ${b.paused_until})` })
  }

  console.log(`Watchdog found ${toResume.length} batches to resume`)

  const results: any[] = []
  for (const b of toResume) {
    // Flip paused → running (and refresh heartbeat) before re-invoking
    await supabase.from('email_batches').update({
      status: 'running',
      paused_reason: null,
      paused_until: null,
      last_heartbeat_at: new Date().toISOString(),
    }).eq('id', b.id)

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-campaign-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ batch_id: b.id }),
      })
      const text = await res.text()
      results.push({ id: b.id, reason: b.reason, status: res.status, body: text.slice(0, 200) })
      console.log(`Resumed ${b.id} (${b.reason}) → HTTP ${res.status}`)
    } catch (e) {
      const errMsg = (e as Error).message
      results.push({ id: b.id, reason: b.reason, error: errMsg })
      console.error(`Failed to resume ${b.id}: ${errMsg}`)
    }
  }

  return new Response(
    JSON.stringify({ resumed: toResume.length, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
