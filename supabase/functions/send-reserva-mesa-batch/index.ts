// Reserva Mesa entry point. Now a pure enqueuer (see send-campaign-batch).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      .from('email_batches_reserva_mesa')
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

    const { data: existing } = await supabase
      .from('email_send_queue')
      .select('prospect_id')
      .eq('batch_id', batch_id)
      .eq('campaign_type', 'reserva_mesa')

    const alreadyQueued = new Set((existing || []).map((r: any) => r.prospect_id))
    const toEnqueue = prospectIds.filter((id) => !alreadyQueued.has(id))

    if (toEnqueue.length === 0) {
      return new Response(JSON.stringify({ batch_id, queued: 0, note: 'all already queued' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const startMs = Date.now()
    const baseOffset = alreadyQueued.size * SEND_SPACING_MS
    const rows = toEnqueue.map((prospect_id, i) => ({
      batch_id,
      prospect_id,
      campaign_type: 'reserva_mesa',
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

    await supabase.from('email_batches_reserva_mesa').update({
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
    console.error('send-reserva-mesa-batch error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
