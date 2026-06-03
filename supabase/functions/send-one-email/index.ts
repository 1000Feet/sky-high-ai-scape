// One-shot worker: sends EXACTLY ONE email from email_send_queue.
// Invoked by dispatch-email-queue (fan-out). Stateless. Target duration <10s.
//
// Flow:
//   1. Atomic claim with lease (claim_email_for_send RPC)
//   2. Idempotency check against campaign_email_log (status='sent')
//   3. Send via Hostinger SMTP
//   4. Log + update queue + bump batch counter
//   5. On failure: backoff (next_attempt_at) or mark failed if attempts >= max

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── 1000 Feet (default) signature & templates ────────────────────────────────
const SIGNATURE_HTML = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:12px;color:#333333;margin-top:20px;">
  <tr>
    <td style="padding-right:14px;vertical-align:top;">
      <img src="https://www.dropbox.com/scl/fi/8tzkd69o12rltv3abhotm/angelo.jpg?rlkey=iiqbtxpksztwawtm13zstwmlb&raw=1"
           width="130" height="130" style="display:block;border-radius:4px;" alt="Angelo Magni" />
    </td>
    <td style="border-left:3px solid #3daaf2;padding-left:14px;vertical-align:top;">
      <div style="font-weight:bold;font-size:14px;color:#222222;">Angelo Magni</div>
      <div style="font-size:12px;color:#555555;margin-bottom:8px;">CEO — 1000 Feet, Inc.</div>
      <div style="font-size:12px;color:#333333;">+39 335 697 8194 &nbsp;·&nbsp; +1 (786) 220 1185</div>
      <div style="font-size:12px;"><a href="mailto:info@1000feetabove.com" style="color:#3daaf2;text-decoration:none;">info@1000feetabove.com</a></div>
      <div style="font-size:12px;"><a href="https://www.1000feetabove.com" style="color:#3daaf2;text-decoration:none;">www.1000feetabove.com</a></div>
      <div style="font-size:12px;color:#555555;">8 The Green, Dover, DE, USA &nbsp;·&nbsp; Villa Brasini, Via Flaminia 495, Roma</div>
      <div style="margin-top:10px;">
        <img src="https://dl.dropboxusercontent.com/scl/fi/0jxsrje0o5cxvpytf1nkd/1000FeetLogo.png?rlkey=pq65v175z94ws1ejjxwabxdu8"
             width="130" height="88" style="display:block;" alt="1000 Feet" />
      </div>
    </td>
  </tr>
</table>
`

function buildHtmlIT(domain: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
<p>Salve,</p>
<p>ho dato un'occhiata a <strong>${domain}</strong> e credo ci siano diversi margini di miglioramento — dal design alla velocità, fino alla conversione dei visitatori.</p>
<p>Vi preparo una <strong>demo gratuita del nuovo sito, senza impegno</strong>. Se vi interessa, basta rispondere con un <strong>"OK"</strong>.</p>
<p>Un saluto,</p>
${SIGNATURE_HTML}
<p style="font-size:11px;color:#999999;margin-top:20px;">—<br>Se preferite non ricevere ulteriori comunicazioni, basta rispondere "rimuovi" e non vi scriverò più.</p>
</div>`
}

function buildHtmlEN(domain: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
<p>Hi,</p>
<p>I took a look at <strong>${domain}</strong> and I think there's quite a bit of room for improvement — from design and speed to visitor conversion.</p>
<p>I'll put together a <strong>free demo of a new site, no strings attached</strong>. If you're interested, just reply with <strong>"OK"</strong>.</p>
<p>Best,</p>
${SIGNATURE_HTML}
<p style="font-size:11px;color:#999999;margin-top:20px;">—<br>If you'd prefer not to receive further emails, just reply "remove" and I won't contact you again.</p>
</div>`
}

// ── Reserva Mesa template ────────────────────────────────────────────────────
function buildHtmlES(businessName: string): string {
  const nombre = businessName || 'amigo'
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
<p>Hola ${nombre},</p>
<p>Soy Angelo, fundador de <strong><a href="https://reservamesa.cr" style="color:#3daaf2;text-decoration:none;">ReservaMesa</a></strong>. Es un sistema gratuito para restaurantes en Costa Rica.</p>
<p>Ayuda con tres cosas:</p>
<p><strong>1. Reservas</strong> — sus clientes reservan desde un link en su web o redes y reciben confirmación y recordatorios automáticos por WhatsApp.</p>
<p><strong>2. Mesas</strong> — dashboard simple para ver qué mesas están ocupadas, libres o por llegar.</p>
<p><strong>3. Comandas digitales</strong> — el staff anota los consumos directamente en cada mesa, y la dashboard suma automáticamente. Reemplaza el cuaderno de papel.</p>
<p>Ustedes reciben cada nueva reserva en su WhatsApp personal, sin necesidad de revisar pantallas.</p>
<p>¿Les muestro cómo funciona en una llamada de 5 minutos?</p>
<p>Pura vida,<br>
Angelo Magni<br>
ReservaMesa<br>
<a href="https://reservamesa.cr" style="color:#3daaf2;text-decoration:none;">https://reservamesa.cr</a><br>
WhatsApp directo: <a href="https://wa.me/50687524442" style="color:#3daaf2;text-decoration:none;">https://wa.me/50687524442</a></p>
<p style="font-size:11px;color:#999999;margin-top:20px;">—<br>Si prefiere no recibir más correos, basta con responder "remover" y no le volveré a escribir.</p>
</div>`
}

// V2: short & personal. Plain look, no heavy HTML, single CTA.
function buildHtmlES2(businessName: string): string {
  const nombre = businessName || 'amigo'
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.55;">
<p>Hola ${nombre},</p>
<p>Soy Angelo. Vi que tienen restaurante en Costa Rica y quería preguntarles algo rápido.</p>
<p>Este mes estamos regalando a 10 restaurantes un sistema gratuito de <strong>reservas + comandas por WhatsApp</strong>. Sin costo, sin contrato.</p>
<p>Si les interesa, contesten "<strong>info</strong>" y les explico en 2 minutos cómo funciona.</p>
<p>Pura vida,<br>
Angelo · ReservaMesa<br>
WhatsApp: <a href="https://wa.me/50687524442" style="color:#3daaf2;text-decoration:none;">wa.me/50687524442</a></p>
<p style="font-size:11px;color:#999;margin-top:18px;">Si prefiere no recibir más correos, responda "remover".</p>
</div>`
}

function detectLanguage(sourceQuery: string | null): 'it' | 'en' {
  if (!sourceQuery) return 'en'
  const code = sourceQuery.split(',').pop()?.trim().toUpperCase() || ''
  return code === 'IT' ? 'it' : 'en'
}

function deriveDomain(website: string | null, name: string): string {
  if (!website) return name
  try {
    return new URL(website.startsWith('http') ? website : `https://${website}`)
      .hostname.replace('www.', '')
  } catch {
    return website
  }
}

const RECIPIENT_ERR_RX = /(\b4\d\d\b|\b5\d\d\b|lookup failure|user unknown|does not exist|invalid recipient|mailbox|no such user|recipient address rejected|nested MAIL command)/i

type CampaignType = 'default' | 'reserva_mesa'

interface CampaignConfig {
  prospectsTable: string
  logTable: string
  batchTable: string
  fromHeader: string
  smtpUser: string
  smtpPasswordEnv: string
}

const CONFIGS: Record<CampaignType, CampaignConfig> = {
  default: {
    prospectsTable: 'potential_clients',
    logTable: 'campaign_email_log',
    batchTable: 'email_batches',
    fromHeader: '1000 Feet Inc. <info@1000feetabove.com>',
    smtpUser: 'info@1000feetabove.com',
    smtpPasswordEnv: 'SMTP_PASSWORD',
  },
  reserva_mesa: {
    prospectsTable: 'potential_clients_reserva_mesa',
    logTable: 'campaign_email_log_reserva_mesa',
    batchTable: 'email_batches_reserva_mesa',
    fromHeader: 'Reserva Mesa <info@reservamesa.cr>',
    smtpUser: 'info@reservamesa.cr',
    smtpPasswordEnv: 'SMTP_PASSWORD_RESERVA_MESA',
  },
}

async function buildSmtpClient(cfg: CampaignConfig): Promise<SMTPClient> {
  return new SMTPClient({
    connection: {
      hostname: 'smtp.hostinger.com',
      port: 465,
      tls: true,
      auth: {
        username: cfg.smtpUser,
        password: Deno.env.get(cfg.smtpPasswordEnv)!,
      },
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let queueId: string
  try {
    const body = await req.json()
    queueId = body.queue_id
    if (!queueId) throw new Error('Missing queue_id')
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const workerId = crypto.randomUUID()

  // 1. Atomic claim
  const { data: claimed, error: claimErr } = await supabase
    .rpc('claim_email_for_send', {
      p_queue_id: queueId,
      p_worker_id: workerId,
      p_lease_seconds: 60,
    })

  if (claimErr) {
    console.error('claim error', claimErr)
    return new Response(JSON.stringify({ error: claimErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!claimed) {
    return new Response(JSON.stringify({ skipped: 'not_claimable' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const cfg = CONFIGS[claimed.campaign_type as CampaignType]
  if (!cfg) {
    await supabase.from('email_send_queue').update({
      status: 'failed', last_error: `unknown campaign_type ${claimed.campaign_type}`,
      claimed_by: null, claimed_until: null,
    }).eq('id', queueId)
    return new Response(JSON.stringify({ error: 'unknown campaign_type' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 2. Load prospect
  const { data: prospect, error: pErr } = await supabase
    .from(cfg.prospectsTable)
    .select('id, name, email, website, source_query')
    .eq('id', claimed.prospect_id)
    .maybeSingle()

  if (pErr || !prospect || !prospect.email) {
    await supabase.from(cfg.logTable).insert({
      batch_id: claimed.batch_id,
      prospect_id: claimed.prospect_id,
      recipient_email: prospect?.email || 'unknown',
      status: 'skipped',
      error_message: pErr?.message || 'no email or prospect missing',
    })
    await supabase.from('email_send_queue').update({
      status: 'skipped', last_error: 'no_email',
      claimed_by: null, claimed_until: null,
    }).eq('id', queueId)
    await supabase.rpc('increment_batch_counter', {
      p_batch_id: claimed.batch_id, p_kind: 'skipped', p_table: cfg.batchTable,
    })
    return new Response(JSON.stringify({ skipped: 'no_email' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 3. Idempotency safety net
  const { data: existing } = await supabase
    .from(cfg.logTable)
    .select('id')
    .eq('batch_id', claimed.batch_id)
    .eq('prospect_id', claimed.prospect_id)
    .eq('status', 'sent')
    .maybeSingle()

  if (existing) {
    await supabase.from('email_send_queue').update({
      status: 'sent', claimed_by: null, claimed_until: null,
    }).eq('id', queueId)
    return new Response(JSON.stringify({ skipped: 'already_sent' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Cross-batch dedupe: don't email same address twice ever (matches old behavior).
  const { data: dupAddr } = await supabase
    .from(cfg.logTable)
    .select('id')
    .eq('recipient_email', prospect.email)
    .eq('status', 'sent')
    .limit(1)
    .maybeSingle()

  if (dupAddr) {
    await supabase.from(cfg.logTable).insert({
      batch_id: claimed.batch_id,
      prospect_id: claimed.prospect_id,
      recipient_email: prospect.email,
      status: 'skipped',
      error_message: 'duplicate (already sent in prior batch)',
    })
    await supabase.from('email_send_queue').update({
      status: 'skipped', claimed_by: null, claimed_until: null,
    }).eq('id', queueId)
    await supabase.rpc('increment_batch_counter', {
      p_batch_id: claimed.batch_id, p_kind: 'skipped', p_table: cfg.batchTable,
    })
    return new Response(JSON.stringify({ skipped: 'duplicate_address' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 4. Build subject + body
  let subject: string
  let html: string
  let language: string

  if (claimed.campaign_type === 'reserva_mesa') {
    language = 'es'
    subject = 'Sistema gratuito para reservas y comandas — ReservaMesa'
    html = buildHtmlES(prospect.name)
  } else {
    language = detectLanguage(prospect.source_query)
    const domain = deriveDomain(prospect.website, prospect.name)
    subject = language === 'it'
      ? `Una demo gratuita del sito per ${prospect.name}`
      : `A free website demo for ${prospect.name}`
    html = language === 'it' ? buildHtmlIT(domain) : buildHtmlEN(domain)
  }

  // 5. Send (single attempt per invocation; retries handled by queue backoff)
  let sent = false
  let lastError = ''
  let smtpClient: SMTPClient | null = null
  try {
    smtpClient = await buildSmtpClient(cfg)
    await smtpClient.send({
      from: cfg.fromHeader,
      to: prospect.email,
      replyTo: cfg.smtpUser,
      subject,
      html,
    })
    sent = true
  } catch (e) {
    lastError = (e as Error).message || String(e)
    console.error(`SMTP send failed for ${prospect.email}: ${lastError}`)
  } finally {
    try { await smtpClient?.close() } catch (_) { /* ignore */ }
  }

  if (sent) {
    await supabase.from(cfg.logTable).insert({
      batch_id: claimed.batch_id,
      prospect_id: claimed.prospect_id,
      recipient_email: prospect.email,
      subject,
      language,
      status: 'sent',
      attempt_count: claimed.attempts,
      sent_at: new Date().toISOString(),
    })
    await supabase.from('email_send_queue').update({
      status: 'sent', claimed_by: null, claimed_until: null, last_error: null,
    }).eq('id', queueId)
    await supabase.rpc('increment_batch_counter', {
      p_batch_id: claimed.batch_id, p_kind: 'sent', p_table: cfg.batchTable,
    })
    await supabase.from(cfg.prospectsTable)
      .update({ contacted: true })
      .eq('id', prospect.id)

    return new Response(JSON.stringify({ sent: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Failure path
  const isRecipientError = RECIPIENT_ERR_RX.test(lastError)
  const giveUp = isRecipientError || claimed.attempts >= claimed.max_attempts

  if (giveUp) {
    await supabase.from(cfg.logTable).insert({
      batch_id: claimed.batch_id,
      prospect_id: claimed.prospect_id,
      recipient_email: prospect.email,
      subject,
      language,
      status: 'failed',
      attempt_count: claimed.attempts,
      error_message: lastError,
    })
    await supabase.from('email_send_queue').update({
      status: 'failed', last_error: lastError,
      claimed_by: null, claimed_until: null,
    }).eq('id', queueId)
    await supabase.rpc('increment_batch_counter', {
      p_batch_id: claimed.batch_id, p_kind: 'failed', p_table: cfg.batchTable,
    })
  } else {
    // Exponential backoff: 2^attempts minutes
    const backoffMs = Math.pow(2, claimed.attempts) * 60_000
    await supabase.from('email_send_queue').update({
      status: 'pending',
      last_error: lastError,
      next_attempt_at: new Date(Date.now() + backoffMs).toISOString(),
      claimed_by: null,
      claimed_until: null,
    }).eq('id', queueId)
  }

  return new Response(JSON.stringify({ sent: false, error: lastError, gave_up: giveUp }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
