// Entry point invoked by the UI when the user starts a campaign.
// This function is now a PURE ENQUEUER: it does NOT send anything itself.
//
// Flow:
//   1. The UI has already created the email_batches row.
//   2. This function inserts one row per prospect into email_send_queue,
//      with next_attempt_at staggered every 96s so the dispatcher naturally
//      respects the SMTP rate limit without any in-function sleep.
//   3. Returns immediately. The dispatcher (pg_cron, every 60s) takes over.
//
// Compatible with the previous signature: { batch_id } in the body.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Spacing between consecutive sends for THIS batch. Hostinger SMTP friendly.
const SEND_SPACING_MS = 96_000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { batch_id } = await req.json() as { batch_id: string }
    if (!batch_id) {
      return new Response(JSON.stringify({ error: 'Missing batch_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: batch, error: bErr } = await supabase
      .from('email_batches')
      .select('id, prospect_ids, status')
      .eq('id', batch_id)
      .single()

    if (bErr || !batch) {
      return new Response(JSON.stringify({ error: 'Batch not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prospectIds: string[] = batch.prospect_ids || []
    if (prospectIds.length === 0) {
      return new Response(JSON.stringify({ batch_id, queued: 0, note: 'empty batch' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check what's already in the queue for this batch (idempotent re-invocation).
    const { data: existing } = await supabase
      .from('email_send_queue')
      .select('prospect_id')
      .eq('batch_id', batch_id)

    const alreadyQueued = new Set((existing || []).map((r: any) => r.prospect_id))
    const toEnqueue = prospectIds.filter((id) => !alreadyQueued.has(id))

    if (toEnqueue.length === 0) {
      return new Response(JSON.stringify({ batch_id, queued: 0, note: 'all already queued' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Stagger by SEND_SPACING_MS so the dispatcher doesn't have to throttle.
    const startMs = Date.now()
    const baseOffset = alreadyQueued.size * SEND_SPACING_MS // continue staggering from where we left off
    const rows = toEnqueue.map((prospect_id, i) => ({
      batch_id,
      prospect_id,
      campaign_type: 'default',
      next_attempt_at: new Date(startMs + baseOffset + i * SEND_SPACING_MS).toISOString(),
    }))

    const { error: insErr } = await supabase
      .from('email_send_queue')
      .insert(rows)

    if (insErr) {
      console.error('enqueue error', insErr)
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Refresh batch heartbeat so the UI shows it as alive.
    await supabase.from('email_batches').update({
      status: 'running',
      last_heartbeat_at: new Date().toISOString(),
    }).eq('id', batch_id)

    return new Response(JSON.stringify({
      success: true,
      batch_id,
      queued: rows.length,
      first_send_at: rows[0].next_attempt_at,
      last_send_at: rows[rows.length - 1].next_attempt_at,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('send-campaign-batch error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
