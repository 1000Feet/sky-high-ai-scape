// Watchdog: finds campaign batches that are stuck (running with stale heartbeat)
// or paused (paused_until in the past), and re-invokes the right sender.
// Scheduled via pg_cron every 5 minutes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STALE_HEARTBEAT_MINUTES = 3

const campaigns = [
  { table: 'email_batches', sender: 'send-campaign-batch', label: 'default' },
  { table: 'email_batches_reserva_mesa', sender: 'send-reserva-mesa-batch', label: 'reserva_mesa' },
] as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const nowIso = new Date().toISOString()
  const staleCutoffIso = new Date(
    Date.now() - STALE_HEARTBEAT_MINUTES * 60 * 1000,
  ).toISOString()

  const results: any[] = []
  let resumed = 0

  for (const campaign of campaigns) {
    // 1) Stale 'running' batches (heartbeat too old → process likely died)
    const { data: staleRunning, error: staleError } = await supabase
      .from(campaign.table)
      .select('id, last_heartbeat_at')
      .eq('status', 'running')
      .lt('last_heartbeat_at', staleCutoffIso)

    if (staleError) {
      console.error(`Watchdog stale query failed for ${campaign.label}: ${staleError.message}`)
      results.push({ campaign: campaign.label, error: staleError.message })
      continue
    }

    // 2) Paused batches whose paused_until has passed
    const { data: readyPaused, error: pausedError } = await supabase
      .from(campaign.table)
      .select('id, paused_until')
      .eq('status', 'paused')
      .or(`paused_until.is.null,paused_until.lt.${nowIso}`)

    if (pausedError) {
      console.error(`Watchdog paused query failed for ${campaign.label}: ${pausedError.message}`)
      results.push({ campaign: campaign.label, error: pausedError.message })
      continue
    }

    const toResume: { id: string; reason: string }[] = []
    for (const b of staleRunning ?? []) {
      toResume.push({ id: b.id, reason: `stale running (heartbeat ${b.last_heartbeat_at})` })
    }
    for (const b of readyPaused ?? []) {
      toResume.push({ id: b.id, reason: `paused expired (until ${b.paused_until})` })
    }

    console.log(`Watchdog found ${toResume.length} ${campaign.label} batches to resume`)
    resumed += toResume.length

    for (const b of toResume) {
      // Flip paused → running (and refresh heartbeat) before re-invoking
      await supabase.from(campaign.table).update({
        status: 'running',
        paused_reason: null,
        paused_until: null,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', b.id)

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${campaign.sender}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ batch_id: b.id }),
        })
        const text = await res.text()
        results.push({ campaign: campaign.label, id: b.id, reason: b.reason, status: res.status, body: text.slice(0, 200) })
        console.log(`Resumed ${campaign.label} ${b.id} (${b.reason}) → HTTP ${res.status}`)
      } catch (e) {
        const errMsg = (e as Error).message
        results.push({ campaign: campaign.label, id: b.id, reason: b.reason, error: errMsg })
        console.error(`Failed to resume ${campaign.label} ${b.id}: ${errMsg}`)
      }
    }
  }

  return new Response(
    JSON.stringify({ resumed, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
