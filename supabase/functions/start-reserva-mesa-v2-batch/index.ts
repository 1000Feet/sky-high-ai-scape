// Manually starts the ReservaMesa V2 campaign.
// Targets ALL prospects with a valid email (272 uncontacted + 640 already
// contacted in V1 = ~912), at ~50/day with ±15% jitter, using a new short
// template (campaign_type='reserva_mesa_v2'). Idempotent: skips queue rows
// already enqueued for the resulting batch.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 50/day → 86400/50 = 1728 seconds between sends
const BASE_SPACING_MS = 1_728_000
const JITTER_RATIO = 0.15

function jitteredSpacing(): number {
  const jitter = (Math.random() * 2 - 1) * JITTER_RATIO // ±15%
  return Math.round(BASE_SPACING_MS * (1 + jitter))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Reject if a V2 batch is already running
    const { data: existingBatches } = await supabase
      .from('email_batches_reserva_mesa')
      .select('id, status, paused_reason')
      .in('status', ['running', 'paused'])

    // We tag V2 batches by paused_reason='__v2_marker' on creation so we can
    // distinguish them from V1. Reject only if a V2 one is active.
    const activeV2 = (existingBatches || []).find(
      (b: any) => (b.paused_reason || '').includes('v2'),
    )
    if (activeV2) {
      return new Response(JSON.stringify({
        skipped: true,
        reason: 'V2 batch already active',
        batch_id: activeV2.id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch ALL prospects with valid email (regardless of `contacted` flag)
    const PAGE = 1000
    const allIds: string[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('potential_clients_reserva_mesa')
        .select('id')
        .not('email', 'is', null)
        .neq('email', '')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      if (!data || data.length === 0) break
      allIds.push(...data.map((r: any) => r.id))
      if (data.length < PAGE) break
      from += PAGE
    }

    if (allIds.length === 0) {
      return new Response(JSON.stringify({ started: false, reason: 'no prospects with email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Shuffle so we don't send the same neighborhood/category in a row
    for (let i = allIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allIds[i], allIds[j]] = [allIds[j], allIds[i]]
    }

    // Create batch (tagged via paused_reason; not actually paused)
    const { data: batch, error: bErr } = await supabase
      .from('email_batches_reserva_mesa')
      .insert({
        status: 'running',
        total: allIds.length,
        prospect_ids: allIds,
        paused_reason: 'v2_marker',
      })
      .select()
      .single()

    if (bErr || !batch) throw bErr || new Error('Failed to create V2 batch')

    // Enqueue with jittered spacing, starting 60s from now
    const startMs = Date.now() + 60_000
    let cursor = startMs
    const rows = allIds.map((prospect_id) => {
      const row = {
        batch_id: batch.id,
        prospect_id,
        campaign_type: 'reserva_mesa_v2',
        next_attempt_at: new Date(cursor).toISOString(),
      }
      cursor += jitteredSpacing()
      return row
    })

    // Insert in chunks (Supabase max ~1000/insert)
    const CHUNK = 500
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error: insErr } = await supabase
        .from('email_send_queue')
        .insert(rows.slice(i, i + CHUNK))
      if (insErr) throw insErr
    }

    return new Response(JSON.stringify({
      success: true,
      batch_id: batch.id,
      total: allIds.length,
      first_send_at: rows[0].next_attempt_at,
      last_send_at: rows[rows.length - 1].next_attempt_at,
      avg_spacing_seconds: BASE_SPACING_MS / 1000,
      estimated_days: Math.ceil(allIds.length / 50),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('start-reserva-mesa-v2-batch error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
