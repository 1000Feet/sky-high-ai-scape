// SMTP campaign batch sender for Costa Rica (Reserva Mesa) via Hostinger.
// Uses a separate sender (info@reservamesa.cr) and the SMTP_PASSWORD_RESERVA_MESA secret.
// Sends Spanish-language emails to potential_clients_reserva_mesa.
// Logs to campaign_email_log_reserva_mesa, tracks state in email_batches_reserva_mesa.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── tunables ─────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 5
const DELAY_MS = 96_000
const DAILY_CAP = parseInt(Deno.env.get('DAILY_CAP_RESERVA_MESA') ?? '900', 10)
const HOURLY_CAP = parseInt(Deno.env.get('HOURLY_CAP_RESERVA_MESA') ?? '999999', 10)
const CIRCUIT_BREAKER = 5

// ── sender config ────────────────────────────────────────────────────────────
const SENDER_EMAIL = 'info@reservamesa.cr'
const SENDER_NAME = 'Reserva Mesa'
const SENDER_FROM = `${SENDER_NAME} <${SENDER_EMAIL}>`

// ── TEMPLATE: ReservaMesa (Costa Rica) ───────────────────────────────────────
function buildSubject(_businessName: string): string {
  return `Sistema gratuito para reservas y comandas — ReservaMesa`
}

function buildHtmlES(businessName: string, _domain: string): string {
  const nombre = businessName || 'amigo'
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
<p>Hola ${nombre},</p>
<p>Soy Angelo, fundador de <strong>ReservaMesa</strong>. Es un sistema gratuito para restaurantes en Costa Rica.</p>
<p>Ayuda con tres cosas:</p>
<p><strong>1. Reservas</strong> — sus clientes reservan desde un widget en su web o redes y reciben confirmación y recordatorios automáticos por WhatsApp.</p>
<p><strong>2. Mesas</strong> — dashboard simple para ver qué mesas están ocupadas, libres o por llegar.</p>
<p><strong>3. Comandas digitales</strong> — el staff anota los consumos directamente en cada mesa, y la dashboard suma automáticamente. Reemplaza el cuaderno de papel.</p>
<p>Ustedes reciben cada nueva reserva en su WhatsApp personal, sin necesidad de revisar pantallas.</p>
<p>El plan Free no tiene costo ni tarjeta de crédito. Los planes pagados empiezan en <strong>$29/mes</strong>.</p>
<p>¿Les muestro cómo funciona en una llamada de 15 minutos?</p>
<p>Pura vida,<br>
Angelo Magni<br>
ReservaMesa<br>
<a href="https://reservamesa.cr" style="color:#3daaf2;text-decoration:none;">https://reservamesa.cr</a><br>
WhatsApp directo: <a href="https://wa.me/50687524442" style="color:#3daaf2;text-decoration:none;">https://wa.me/50687524442</a></p>
<p style="font-size:11px;color:#999999;margin-top:20px;">—<br>Si prefiere no recibir más correos, basta con responder "remover" y no le volveré a escribir.</p>
</div>`
}
const SUBJECT_SAFETY_RX = /(ReservaMesa|reservas)/i

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function deriveDomain(website: string | null, name: string): string {
  if (!website) return name
  try {
    return new URL(website.startsWith('http') ? website : `https://${website}`)
      .hostname.replace('www.', '')
  } catch {
    return website
  }
}

async function buildSmtpClient(): Promise<SMTPClient> {
  return new SMTPClient({
    connection: {
      hostname: 'smtp.hostinger.com',
      port: 465,
      tls: true,
      auth: {
        username: SENDER_EMAIL,
        password: Deno.env.get('SMTP_PASSWORD_RESERVA_MESA')!,
      },
    },
  })
}

async function processChunk(batchId: string, supabaseUrl: string, serviceKey: string) {
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: batch, error: bErr } = await supabase
    .from('email_batches_reserva_mesa')
    .select('*')
    .eq('id', batchId)
    .single()

  if (bErr || !batch) {
    console.error('Batch not found', bErr)
    return
  }
  if (batch.status !== 'running') {
    console.log(`Batch ${batchId} not running (${batch.status}), exiting`)
    return
  }

  const prospectIds: string[] = batch.prospect_ids || []
  let cursor: number = batch.cursor
  let consecutiveFailures: number = batch.consecutive_failures
  let processedThisChunk = 0

  while (cursor < prospectIds.length && processedThisChunk < CHUNK_SIZE) {
    // Stop request check
    const { data: stopCheck } = await supabase
      .from('email_batches_reserva_mesa').select('stop_requested').eq('id', batchId).single()
    if (stopCheck?.stop_requested) {
      await supabase.from('email_batches_reserva_mesa').update({
        status: 'stopped', completed_at: new Date().toISOString(),
      }).eq('id', batchId)
      console.log(`Batch ${batchId} stopped by user`)
      return
    }

    const prospectId = prospectIds[cursor]

    const { data: prospect, error: pErr } = await supabase
      .from('potential_clients_reserva_mesa')
      .select('id, name, email, website')
      .eq('id', prospectId)
      .maybeSingle()

    if (pErr || !prospect || !prospect.email) {
      await supabase.from('campaign_email_log_reserva_mesa').insert({
        batch_id: batchId,
        prospect_id: prospectId,
        recipient_email: prospect?.email || 'unknown',
        status: 'skipped',
        error_message: pErr?.message || 'no email or prospect missing',
      })
      cursor++
      await supabase.from('email_batches_reserva_mesa').update({
        cursor,
        skipped_count: batch.skipped_count + 1,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      batch.skipped_count++
      processedThisChunk++
      continue
    }

    const domain = deriveDomain(prospect.website, prospect.name)
    const subject = buildSubject(prospect.name)

    if (!SUBJECT_SAFETY_RX.test(subject)) {
      await supabase.from('campaign_email_log_reserva_mesa').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language: 'es',
        status: 'skipped',
        error_message: 'subject failed safety filter',
      })
      cursor++
      await supabase.from('email_batches_reserva_mesa').update({
        cursor, skipped_count: batch.skipped_count + 1,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      batch.skipped_count++
      processedThisChunk++
      continue
    }

    // Anti-duplicate (within reserva mesa log only)
    const { data: dup } = await supabase
      .from('campaign_email_log_reserva_mesa')
      .select('id')
      .eq('recipient_email', prospect.email)
      .eq('status', 'sent')
      .limit(1)
      .maybeSingle()

    if (dup) {
      await supabase.from('campaign_email_log_reserva_mesa').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language: 'es',
        status: 'skipped',
        error_message: 'duplicate (already sent in prior batch)',
      })
      cursor++
      await supabase.from('email_batches_reserva_mesa').update({
        cursor, skipped_count: batch.skipped_count + 1,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      batch.skipped_count++
      processedThisChunk++
      continue
    }

    // Rate-limit
    const nowMs = Date.now()
    const oneDayAgoIso = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString()
    const oneHourAgoIso = new Date(nowMs - 60 * 60 * 1000).toISOString()

    const [{ count: dailyCount }, { count: hourlyCount }] = await Promise.all([
      supabase.from('campaign_email_log_reserva_mesa').select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', oneDayAgoIso),
      supabase.from('campaign_email_log_reserva_mesa').select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', oneHourAgoIso),
    ])

    let pauseUntilMs: number | null = null
    let pauseReason: 'daily_cap' | 'hourly_cap' | null = null

    if ((dailyCount ?? 0) >= DAILY_CAP) {
      const { data: oldest } = await supabase
        .from('campaign_email_log_reserva_mesa').select('sent_at')
        .eq('status', 'sent').gte('sent_at', oneDayAgoIso)
        .order('sent_at', { ascending: true }).limit(1).maybeSingle()
      if (oldest?.sent_at) {
        pauseUntilMs = new Date(oldest.sent_at).getTime() + 24 * 60 * 60 * 1000
        pauseReason = 'daily_cap'
      }
    } else if ((hourlyCount ?? 0) >= HOURLY_CAP) {
      const { data: oldest } = await supabase
        .from('campaign_email_log_reserva_mesa').select('sent_at')
        .eq('status', 'sent').gte('sent_at', oneHourAgoIso)
        .order('sent_at', { ascending: true }).limit(1).maybeSingle()
      if (oldest?.sent_at) {
        pauseUntilMs = new Date(oldest.sent_at).getTime() + 60 * 60 * 1000
        pauseReason = 'hourly_cap'
      }
    }

    if (pauseReason && pauseUntilMs) {
      console.log(`Rate limit hit: ${pauseReason}, paused until ${new Date(pauseUntilMs).toISOString()}`)
      await supabase.from('email_batches_reserva_mesa').update({
        status: 'paused',
        paused_reason: pauseReason,
        paused_until: new Date(pauseUntilMs).toISOString(),
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      return
    }

    if (batch.paused_reason || batch.paused_until) {
      await supabase.from('email_batches_reserva_mesa').update({
        paused_reason: null, paused_until: null,
      }).eq('id', batchId)
      batch.paused_reason = null
      batch.paused_until = null
    }

    const html = buildHtmlES(prospect.name, domain)

    let sent = false
    let lastError = ''
    let attempt = 0
    for (attempt = 1; attempt <= 2; attempt++) {
      let attemptClient: SMTPClient | null = null
      try {
        attemptClient = await buildSmtpClient()
        await attemptClient.send({
          from: SENDER_FROM,
          to: prospect.email,
          replyTo: SENDER_EMAIL,
          subject,
          html,
        })
        sent = true
        break
      } catch (e) {
        lastError = (e as Error).message || String(e)
        console.error(`Send attempt ${attempt} failed for ${prospect.email}: ${lastError}`)
      } finally {
        try { await attemptClient?.close() } catch (_) { /* ignore */ }
      }
    }

    const isRecipientError = !sent && /(\b4\d\d\b|\b5\d\d\b|lookup failure|user unknown|does not exist|invalid recipient|mailbox|no such user|recipient address rejected|nested MAIL command)/i.test(lastError)

    if (sent) {
      await supabase.from('campaign_email_log_reserva_mesa').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language: 'es',
        status: 'sent',
        attempt_count: attempt,
        sent_at: new Date().toISOString(),
      })
      consecutiveFailures = 0
      batch.sent_count++
      cursor++
      await supabase.from('email_batches_reserva_mesa').update({
        cursor,
        sent_count: batch.sent_count,
        consecutive_failures: 0,
        last_error: null,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)

      await supabase.from('potential_clients_reserva_mesa')
        .update({ contacted: true })
        .eq('id', prospect.id)
    } else {
      await supabase.from('campaign_email_log_reserva_mesa').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language: 'es',
        status: 'failed',
        attempt_count: attempt - 1,
        error_message: lastError,
      })
      batch.failed_count++
      cursor++

      if (isRecipientError) {
        consecutiveFailures = 0
        await supabase.from('email_batches_reserva_mesa').update({
          cursor,
          failed_count: batch.failed_count,
          consecutive_failures: 0,
          last_error: lastError,
          last_heartbeat_at: new Date().toISOString(),
        }).eq('id', batchId)
      } else {
        consecutiveFailures++
        await supabase.from('email_batches_reserva_mesa').update({
          cursor,
          failed_count: batch.failed_count,
          consecutive_failures: consecutiveFailures,
          last_error: lastError,
          last_heartbeat_at: new Date().toISOString(),
        }).eq('id', batchId)

        if (consecutiveFailures >= CIRCUIT_BREAKER) {
          await supabase.from('email_batches_reserva_mesa').update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            last_error: `Circuit breaker: ${CIRCUIT_BREAKER} consecutive infra failures. Last: ${lastError}`,
          }).eq('id', batchId)
          console.error(`Batch ${batchId} circuit-broken`)
          return
        }
      }
    }

    processedThisChunk++
    if (cursor < prospectIds.length) await sleep(DELAY_MS)
  }

  if (cursor >= prospectIds.length) {
    await supabase.from('email_batches_reserva_mesa').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', batchId)
    console.log(`Batch ${batchId} completed`)
  } else {
    console.log(`Batch ${batchId} chunk done at cursor=${cursor}, re-invoking`)
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-reserva-mesa-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ batch_id: batchId, _continuation: true }),
      })
      if (!res.ok) {
        const txt = await res.text()
        const errMsg = `Re-invoke HTTP ${res.status}: ${txt.slice(0, 200)}`
        console.error(errMsg)
        await supabase.from('email_batches_reserva_mesa').update({
          last_error: errMsg,
        }).eq('id', batchId)
      } else {
        await res.text()
      }
    } catch (e) {
      const errMsg = `Re-invoke failed: ${(e as Error).message}`
      console.error(errMsg)
      await supabase.from('email_batches_reserva_mesa').update({
        last_error: errMsg,
      }).eq('id', batchId)
    }
  }
}

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

    // @ts-ignore EdgeRuntime is provided by Supabase runtime
    EdgeRuntime.waitUntil(processChunk(batch_id, supabaseUrl, serviceKey))

    return new Response(JSON.stringify({ success: true, batch_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('send-reserva-mesa-batch error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
