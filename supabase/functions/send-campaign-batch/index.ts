// SMTP campaign batch sender via Hostinger.
// Self-re-invokes in chunks to avoid edge function timeout.
// State persisted to email_batches.cursor after every email — crash-safe.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── tunables ─────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 5                // prospects per invocation (small: 96s delay × 5 = 8min, well under CPU limit)
const DELAY_MS = 96_000             // 96s between sends → ~37/h, ~900/day, distributes evenly across 24h
const RETRY_DELAY_MS = 60_000       // backoff before single retry (unused; kept for ref)
// Configurable via env vars. DAILY_CAP=900 leaves ~100/day headroom for ops mail.
const DAILY_CAP = parseInt(Deno.env.get('DAILY_CAP') ?? '900', 10)
// Hourly cap removed: the 96s natural delay caps throughput at ~37/h, well under any sane limit.
// Set to a very high value to effectively disable the check while keeping the code path intact.
const HOURLY_CAP = parseInt(Deno.env.get('HOURLY_CAP') ?? '999999', 10)
// Launch delay: do not send any email before this timestamp (set when user wants to throttle start).
const LAUNCH_AFTER_ISO = Deno.env.get('LAUNCH_AFTER_ISO') ?? ''
const MAX_INPROCESS_PAUSE_MS = 5 * 60 * 1000  // beyond this → exit chunk + re-invoke
const RE_INVOKE_DELAY_MS = 60_000             // wait before re-invoking when paused
const CIRCUIT_BREAKER = 5           // consecutive failures → fail batch
const SUBJECT_SAFETY_RX = /(free website demo|demo gratuita)/i

// ── signature (same as create-gmail-draft) ───────────────────────────────────
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

async function buildSmtpClient(): Promise<SMTPClient> {
  return new SMTPClient({
    connection: {
      hostname: 'smtp.hostinger.com',
      port: 465,
      tls: true, // SMTPS implicit TLS
      auth: {
        username: 'info@1000feetabove.com',
        password: Deno.env.get('SMTP_PASSWORD')!,
      },
    },
  })
}

// Process up to CHUNK_SIZE prospects, then re-invoke if more remain.
async function processChunk(batchId: string, supabaseUrl: string, serviceKey: string) {
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: batch, error: bErr } = await supabase
    .from('email_batches')
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

  // Global launch delay: if LAUNCH_AFTER_ISO is set and in the future, pause batch until then
  if (LAUNCH_AFTER_ISO) {
    const launchMs = new Date(LAUNCH_AFTER_ISO).getTime()
    if (!isNaN(launchMs) && Date.now() < launchMs) {
      console.log(`Launch gate active: pausing until ${LAUNCH_AFTER_ISO}`)
      await supabase.from('email_batches').update({
        status: 'paused',
        paused_reason: 'launch_delay',
        paused_until: LAUNCH_AFTER_ISO,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      return
    }
  }

  while (cursor < prospectIds.length && processedThisChunk < CHUNK_SIZE) {
    // Stop request check
    const { data: stopCheck } = await supabase
      .from('email_batches').select('stop_requested').eq('id', batchId).single()
    if (stopCheck?.stop_requested) {
      await supabase.from('email_batches').update({
        status: 'stopped', completed_at: new Date().toISOString(),
      }).eq('id', batchId)
      console.log(`Batch ${batchId} stopped by user`)
      return
    }

    const prospectId = prospectIds[cursor]

    const { data: prospect, error: pErr } = await supabase
      .from('potential_clients')
      .select('id, name, email, website, source_query')
      .eq('id', prospectId)
      .maybeSingle()

    if (pErr || !prospect || !prospect.email) {
      await supabase.from('campaign_email_log').insert({
        batch_id: batchId,
        prospect_id: prospectId,
        recipient_email: prospect?.email || 'unknown',
        status: 'skipped',
        error_message: pErr?.message || 'no email or prospect missing',
      })
      cursor++
      await supabase.from('email_batches').update({
        cursor,
        skipped_count: batch.skipped_count + 1,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      batch.skipped_count++
      processedThisChunk++
      continue
    }

    const language = detectLanguage(prospect.source_query)
    const domain = deriveDomain(prospect.website, prospect.name)
    const subject = language === 'it'
      ? `Una demo gratuita del sito per ${prospect.name}`
      : `A free website demo for ${prospect.name}`

    // Safety: subject must contain expected phrase
    if (!SUBJECT_SAFETY_RX.test(subject)) {
      await supabase.from('campaign_email_log').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language,
        status: 'skipped',
        error_message: 'subject failed safety filter',
      })
      cursor++
      await supabase.from('email_batches').update({
        cursor, skipped_count: batch.skipped_count + 1,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      batch.skipped_count++
      processedThisChunk++
      continue
    }

    // Anti-duplicate
    const { data: dup } = await supabase
      .from('campaign_email_log')
      .select('id')
      .eq('recipient_email', prospect.email)
      .eq('status', 'sent')
      .limit(1)
      .maybeSingle()

    if (dup) {
      await supabase.from('campaign_email_log').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language,
        status: 'skipped',
        error_message: 'duplicate (already sent in prior batch)',
      })
      cursor++
      await supabase.from('email_batches').update({
        cursor, skipped_count: batch.skipped_count + 1,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      batch.skipped_count++
      processedThisChunk++
      continue
    }

    // ── Rate-limit: rolling 24h DAILY_CAP + rolling 1h HOURLY_CAP ──────────
    const nowMs = Date.now()
    const oneDayAgoIso = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString()
    const oneHourAgoIso = new Date(nowMs - 60 * 60 * 1000).toISOString()

    const [{ count: dailyCount }, { count: hourlyCount }] = await Promise.all([
      supabase.from('campaign_email_log').select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', oneDayAgoIso),
      supabase.from('campaign_email_log').select('id', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', oneHourAgoIso),
    ])

    let pauseUntilMs: number | null = null
    let pauseReason: 'daily_cap' | 'hourly_cap' | null = null

    if ((dailyCount ?? 0) >= DAILY_CAP) {
      const { data: oldest } = await supabase
        .from('campaign_email_log').select('sent_at')
        .eq('status', 'sent').gte('sent_at', oneDayAgoIso)
        .order('sent_at', { ascending: true }).limit(1).maybeSingle()
      if (oldest?.sent_at) {
        pauseUntilMs = new Date(oldest.sent_at).getTime() + 24 * 60 * 60 * 1000
        pauseReason = 'daily_cap'
      }
    } else if ((hourlyCount ?? 0) >= HOURLY_CAP) {
      const { data: oldest } = await supabase
        .from('campaign_email_log').select('sent_at')
        .eq('status', 'sent').gte('sent_at', oneHourAgoIso)
        .order('sent_at', { ascending: true }).limit(1).maybeSingle()
      if (oldest?.sent_at) {
        pauseUntilMs = new Date(oldest.sent_at).getTime() + 60 * 60 * 1000
        pauseReason = 'hourly_cap'
      }
    }

    if (pauseReason && pauseUntilMs) {
      console.log(`Rate limit hit: ${pauseReason}, marking paused until ${new Date(pauseUntilMs).toISOString()} and exiting`)
      await supabase.from('email_batches').update({
        status: 'paused',
        paused_reason: pauseReason,
        paused_until: new Date(pauseUntilMs).toISOString(),
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)
      return
    }

    if (batch.paused_reason || batch.paused_until) {
      await supabase.from('email_batches').update({
        paused_reason: null, paused_until: null,
      }).eq('id', batchId)
      batch.paused_reason = null
      batch.paused_until = null
    }

    const html = language === 'it' ? buildHtmlIT(domain) : buildHtmlEN(domain)

    // Fresh SMTP connection per attempt: after SMTP protocol errors the session can be poisoned
    // and reusing it causes cascaded failures like "503 nested MAIL command".
    let sent = false
    let lastError = ''
    let attempt = 0
    for (attempt = 1; attempt <= 2; attempt++) {
      let attemptClient: SMTPClient | null = null
      try {
        attemptClient = await buildSmtpClient()
        await attemptClient.send({
          from: '1000 Feet Inc. <info@1000feetabove.com>',
          to: prospect.email,
          replyTo: 'info@1000feetabove.com',
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
      await supabase.from('campaign_email_log').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language,
        status: 'sent',
        attempt_count: attempt,
        sent_at: new Date().toISOString(),
      })
      consecutiveFailures = 0
      batch.sent_count++
      cursor++
      await supabase.from('email_batches').update({
        cursor,
        sent_count: batch.sent_count,
        consecutive_failures: 0,
        last_error: null,
        last_heartbeat_at: new Date().toISOString(),
      }).eq('id', batchId)

      await supabase.from('potential_clients')
        .update({ contacted: true })
        .eq('id', prospect.id)
    } else {
      await supabase.from('campaign_email_log').insert({
        batch_id: batchId,
        prospect_id: prospect.id,
        recipient_email: prospect.email,
        subject,
        language,
        status: 'failed',
        attempt_count: attempt - 1,
        error_message: lastError,
      })
      batch.failed_count++
      cursor++

      if (isRecipientError) {
        console.log(`Recipient-level error for ${prospect.email}, skipping (not counting toward circuit breaker): ${lastError}`)
        consecutiveFailures = 0
        await supabase.from('email_batches').update({
          cursor,
          failed_count: batch.failed_count,
          consecutive_failures: 0,
          last_error: lastError,
          last_heartbeat_at: new Date().toISOString(),
        }).eq('id', batchId)
      } else {
        consecutiveFailures++
        await supabase.from('email_batches').update({
          cursor,
          failed_count: batch.failed_count,
          consecutive_failures: consecutiveFailures,
          last_error: lastError,
          last_heartbeat_at: new Date().toISOString(),
        }).eq('id', batchId)

        if (consecutiveFailures >= CIRCUIT_BREAKER) {
          await supabase.from('email_batches').update({
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
    await supabase.from('email_batches').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', batchId)
    console.log(`Batch ${batchId} completed`)
  } else {
    console.log(`Batch ${batchId} chunk done at cursor=${cursor}, re-invoking`)
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-campaign-batch`, {
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
        await supabase.from('email_batches').update({
          last_error: errMsg,
        }).eq('id', batchId)
      } else {
        await res.text()
      }
    } catch (e) {
      const errMsg = `Re-invoke failed: ${(e as Error).message}`
      console.error(errMsg)
      await supabase.from('email_batches').update({
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

    // Run in background, return immediately
    // @ts-ignore EdgeRuntime is provided by Supabase runtime
    EdgeRuntime.waitUntil(processChunk(batch_id, supabaseUrl, serviceKey))

    return new Response(JSON.stringify({ success: true, batch_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('send-campaign-batch error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
