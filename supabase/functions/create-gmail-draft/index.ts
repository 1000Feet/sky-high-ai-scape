import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors'

// ─── helpers ──────────────────────────────────────────────────────────────────

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function getGmailAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     Deno.env.get('GMAIL_CLIENT_ID')!,
      client_secret: Deno.env.get('GMAIL_CLIENT_SECRET')!,
      refresh_token: Deno.env.get('GMAIL_REFRESH_TOKEN')!,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  const { access_token } = await res.json()
  return access_token
}

function buildEmailRaw(to: string, subject: string, htmlBody: string): string {
  const message = [
    `MIME-Version: 1.0`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    htmlBody,
  ].join('\r\n')
  return toBase64Url(message)
}

// ─── signature ────────────────────────────────────────────────────────────────

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
      <table cellpadding="0" cellspacing="2" border="0">
        <tr>
          <td style="padding:2px 4px 2px 0;vertical-align:middle;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjODg4ODg4Ij48cGF0aCBkPSJNNi42IDEwLjhjMS40IDIuOCAzLjggNS4xIDYuNiA2LjZsMi4yLTIuMmMuMy0uMy43LS40IDEtLjIgMS4xLjQgMi4zLjYgMy42LjYuNiAwIDEgLjQgMSAxVjIwYzAgLjYtLjQgMS0xIDEtOS40IDAtMTctNy42LTE3LTE3IDAtLjYuNC0xIDEtMWgzLjVjLjYgMCAxIC40IDEgMSAwIDEuMy4yIDIuNS42IDMuNi4xLjMgMCAuNy0uMiAxTDYuNiAxMC44eiIvPjwvc3ZnPg=="
                 width="13" height="13" alt="" />
          </td>
          <td style="padding:2px 0;font-size:12px;color:#333333;">+39 335 697 8194 &nbsp;·&nbsp; +1 (786) 220 1185</td>
        </tr>
        <tr>
          <td style="padding:2px 4px 2px 0;vertical-align:middle;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjODg4ODg4Ij48cGF0aCBkPSJNMjAgNEg0Yy0xLjEgMC0yIC45LTIgMnYxMmMwIDEuMS45IDIgMiAyaDE2YzEuMSAwIDItLjkgMi0yVjZjMC0xLjEtLjktMi0yLTJ6bTAgNGwtOCA1LTgtNVY2bDggNSA4LTV2MnoiLz48L3N2Zz4="
                 width="13" height="13" alt="" />
          </td>
          <td style="padding:2px 0;font-size:12px;color:#333333;">
            <a href="mailto:info@1000feetabove.com" style="color:#3daaf2;text-decoration:none;">info@1000feetabove.com</a>
          </td>
        </tr>
        <tr>
          <td style="padding:2px 4px 2px 0;vertical-align:middle;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjODg4ODg4Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTEgMTcuOTNjLTMuOTUtLjQ5LTctMy44NS03LTcuOTMgMC0uNjIuMDgtMS4yMS4yMS0xLjc5TDkgMTV2MWMwIDEuMS45IDIgMiAydjEuOTN6bTYuOS0yLjU0Yy0uMjYtLjgxLTEtMS4zOS0xLjktMS4zOWgtMXYtM2MwLS41NS0uNDUtMS0xLTFIOHYtMmgyYy41NSAwIDEtLjQ1IDEtMVY3aDJjMS4xIDAgMi0uOSAyLTJ2LS40MWMyLjkzIDEuMTkgNSA0LjA2IDUgNy40MSAwIDIuMDgtLjggMy45Ny0yLjEgNS4zOXoiLz48L3N2Zz4="
                 width="13" height="13" alt="" />
          </td>
          <td style="padding:2px 0;font-size:12px;color:#333333;">
            <a href="https://www.1000feetabove.com" style="color:#3daaf2;text-decoration:none;">www.1000feetabove.com</a>
          </td>
        </tr>
        <tr>
          <td style="padding:2px 4px 2px 0;vertical-align:middle;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjODg4ODg4Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMiAtMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg=="
                 width="13" height="13" alt="" />
          </td>
          <td style="padding:2px 0;font-size:12px;color:#555555;">8 The Green, Dover, DE, USA &nbsp;·&nbsp; Villa Brasini, Via Flaminia 495, Roma</td>
        </tr>
      </table>
      <div style="margin-top:10px;">
        <img src="https://dl.dropboxusercontent.com/scl/fi/0jxsrje0o5cxvpytf1nkd/1000FeetLogo.png?rlkey=pq65v175z94ws1ejjxwabxdu8"
             width="130" height="88" style="display:block;" alt="1000 Feet" />
      </div>
    </td>
  </tr>
</table>
`

// ─── email templates ───────────────────────────────────────────────────────────

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

// ─── main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { prospect_id, language } = await req.json() as { prospect_id: string; language: 'it' | 'en' }

    if (!prospect_id || !language) {
      return new Response(JSON.stringify({ error: 'Missing prospect_id or language' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── fetch prospect from DB ──────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: prospect, error: dbError } = await supabase
      .from('potential_clients')
      .select('name, email, website')
      .eq('id', prospect_id)
      .single()

    if (dbError || !prospect) {
      return new Response(JSON.stringify({ error: 'Prospect not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!prospect.email) {
      return new Response(JSON.stringify({ error: 'No email for this prospect' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── derive domain ───────────────────────────────────────────────────────
    let domain = prospect.website || prospect.name
    try {
      domain = new URL(prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`).hostname.replace('www.', '')
    } catch { /* keep raw value */ }

    // ── build email ─────────────────────────────────────────────────────────
    const subject = language === 'it'
      ? `Una demo gratuita del sito per ${prospect.name}`
      : `A free website demo for ${prospect.name}`

    const htmlBody = language === 'it' ? buildHtmlIT(domain) : buildHtmlEN(domain)
    const rawEmail = buildEmailRaw(prospect.email, subject, htmlBody)

    // ── get Gmail access token ──────────────────────────────────────────────
    const accessToken = await getGmailAccessToken()

    // ── create draft ────────────────────────────────────────────────────────
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { raw: rawEmail } }),
    })

    if (!gmailRes.ok) {
      const errText = await gmailRes.text()
      console.error('Gmail API error:', errText)
      return new Response(JSON.stringify({ error: 'Gmail API error', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const draft = await gmailRes.json()
    console.log(`Draft created: ${draft.id} for ${prospect.email}`)

    return new Response(JSON.stringify({ success: true, draft_id: draft.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('create-gmail-draft error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
