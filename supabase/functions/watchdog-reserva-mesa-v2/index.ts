// Watchdog per la campagna ReservaMesa V2.
// Eseguito ogni 6h via pg_cron. Verifica che il batch V2 stia progredendo
// e lo "sblocca" automaticamente se trova problemi:
//   1. Riprende righe in `sending` con lease scaduto (oltre quanto fa il dispatcher).
//   2. Se il batch è in stato `paused`, lo rimette in `running`.
//   3. Se trova >0 righe pending il cui next_attempt_at è oltre 10 minuti
//      nel passato, invoca il dispatcher per drenare la coda.
//   4. Log con stato corrente del batch V2.

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

    const actions: string[] = []

    // 1. Trova il batch V2 attivo (running o paused, marker 'v2')
    const { data: batches } = await supabase
      .from('email_batches_reserva_mesa')
      .select('id, status, total, sent_count, failed_count, skipped_count, cursor, paused_reason, started_at')
      .in('status', ['running', 'paused'])
      .order('started_at', { ascending: false })

    const v2 = (batches || []).find((b: any) => (b.paused_reason || '').includes('v2'))

    if (!v2) {
      return new Response(JSON.stringify({
        ok: true,
        message: 'No active V2 batch — watchdog has nothing to do',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Se è paused, lo rimettiamo running
    if (v2.status === 'paused') {
      await supabase
        .from('email_batches_reserva_mesa')
        .update({ status: 'running' })
        .eq('id', v2.id)
      actions.push(`batch ${v2.id} resumed from paused -> running`)
    }

    // 3. Recupera righe `sending` con lease scaduto (>5 minuti)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recovered } = await supabase
      .from('email_send_queue')
      .update({ status: 'pending', claimed_by: null, claimed_until: null })
      .eq('campaign_type', 'reserva_mesa_v2')
      .eq('status', 'sending')
      .lt('claimed_until', fiveMinAgo)
      .select('id')
    if (recovered && recovered.length > 0) {
      actions.push(`recovered ${recovered.length} stuck 'sending' rows`)
    }

    // 4. Conta pending in ritardo > 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count: lateCount } = await supabase
      .from('email_send_queue')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_type', 'reserva_mesa_v2')
      .eq('status', 'pending')
      .lt('next_attempt_at', tenMinAgo)

    if ((lateCount ?? 0) > 0) {
      actions.push(`${lateCount} pending rows are >10min late — invoking dispatcher`)
      // Chiama il dispatcher (fire-and-forget). Il dispatcher gestisce naturalmente la coda.
      // Ne chiamiamo qualcuno in più per drenare backlog.
      const calls = Math.min(5, Math.ceil((lateCount ?? 0) / 20))
      await Promise.allSettled(
        Array.from({ length: calls }).map(() =>
          fetch(`${supabaseUrl}/functions/v1/dispatch-email-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
            body: '{}',
          }).then((r) => r.text())
        )
      )
    }

    // 5. Stato attuale per il log
    const { data: stats } = await supabase
      .from('email_send_queue')
      .select('status')
      .eq('campaign_type', 'reserva_mesa_v2')

    const counts: Record<string, number> = {}
    for (const r of stats || []) counts[r.status] = (counts[r.status] || 0) + 1

    return new Response(JSON.stringify({
      ok: true,
      batch_id: v2.id,
      batch_status: v2.status,
      progress: `${v2.sent_count}/${v2.total} sent, ${v2.failed_count} failed, ${v2.skipped_count} skipped`,
      queue_counts: counts,
      late_pending: lateCount ?? 0,
      actions_taken: actions,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('watchdog-reserva-mesa-v2 error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
