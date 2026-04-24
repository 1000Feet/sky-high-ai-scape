import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors'

const AGENT_IDS = {
  it: 'agent_011Ca1ebv6P5EyHxBVKBt2VQ',
  en: 'agent_011Ca1eTUSpAteeuooaRzpDA',
}

const ENVIRONMENT_ID = 'env_01NK631iuUhUr36YPQnesg8Z'
const POLL_INTERVAL_MS = 10_000
const MAX_POLLS = 60 // 10 min max

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lead_id, business_name, website_url, language = 'it' } = await req.json()

    if (!website_url || !business_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_AGENTS_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const agentId = language === 'en' ? AGENT_IDS.en : AGENT_IDS.it

    // Insert audit record
    const { data: audit, error: insertError } = await supabase
      .from('website_audits')
      .insert({
        lead_id,
        business_name,
        website_url,
        status: 'running',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Create a Managed Agent session
    const userMessage = language === 'it'
      ? `Per favore analizza il sito web ${website_url} (business: ${business_name}) e fornisci un report completo con punteggi per qualità del design, SEO e mobile-friendliness. Rispondi con un JSON contenente: quick_verdict, overall_score, design_score, seo_score, mobile_score, full_report.`
      : `Please audit the website ${website_url} (business: ${business_name}) and give me a full report with scores for design quality, SEO, and mobile-friendliness. Respond with a JSON containing: quick_verdict, overall_score, design_score, seo_score, mobile_score, full_report.`

    console.log(`Creating Managed Agent session for ${website_url} with agent ${agentId}`)

    const createResponse = await fetch('https://api.anthropic.com/v1/sessions', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'managed-agents-2026-04-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        environment_id: ENVIRONMENT_ID,
        events: [{
          type: 'user.message',
          text: userMessage,
        }],
      }),
    })

    if (!createResponse.ok) {
      const errText = await createResponse.text()
      console.error('Managed Agent session creation error:', errText)
      await supabase.from('website_audits').update({ status: 'failed' }).eq('id', audit.id)
      return new Response(JSON.stringify({ error: 'Managed Agent API error', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const session = await createResponse.json()
    const sessionId = session.id

    console.log(`Session created: ${sessionId}`)

    // Save session ID
    await supabase.from('website_audits')
      .update({ agent_session_id: sessionId })
      .eq('id', audit.id)

    // Poll until session completes
    let finalContent = ''
    let pollCount = 0

    while (pollCount < MAX_POLLS) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
      pollCount++

      const pollResponse = await fetch(`https://api.anthropic.com/v1/sessions/${sessionId}`, {
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'managed-agents-2026-04-01',
        },
      })

      if (!pollResponse.ok) {
        const errText = await pollResponse.text()
        console.error(`Poll error (attempt ${pollCount}):`, errText)
        continue
      }

      const pollData = await pollResponse.json()
      console.log(`Poll ${pollCount}: status=${pollData.status}`)

      if (pollData.status === 'completed' || pollData.status === 'ended') {
        // Extract the last assistant message
        const events = pollData.events || []
        for (let i = events.length - 1; i >= 0; i--) {
          if (events[i].type === 'assistant' || events[i].role === 'assistant') {
            finalContent = events[i].text || events[i].content || ''
            break
          }
        }
        if (!finalContent && pollData.result) {
          finalContent = typeof pollData.result === 'string' ? pollData.result : JSON.stringify(pollData.result)
        }
        break
      }

      if (pollData.status === 'failed' || pollData.status === 'error') {
        console.error('Agent session failed:', JSON.stringify(pollData))
        await supabase.from('website_audits').update({ status: 'failed' }).eq('id', audit.id)
        return new Response(JSON.stringify({ error: 'Agent session failed', details: pollData }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!finalContent) {
      console.error('Agent session timed out or produced no content')
      await supabase.from('website_audits').update({ status: 'failed' }).eq('id', audit.id)
      return new Response(JSON.stringify({ error: 'Agent session timed out' }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse JSON from response
    let parsed: any = {}
    try {
      const jsonMatch = finalContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Failed to parse audit response:', e)
      parsed = {
        quick_verdict: finalContent.substring(0, 500),
        overall_score: null,
        design_score: null,
        seo_score: null,
        mobile_score: null,
        full_report: finalContent,
      }
    }

    // Update audit record
    const { error: updateError } = await supabase
      .from('website_audits')
      .update({
        status: 'completed',
        quick_verdict: parsed.quick_verdict || null,
        overall_score: parsed.overall_score || null,
        design_score: parsed.design_score || null,
        seo_score: parsed.seo_score || null,
        mobile_score: parsed.mobile_score || null,
        full_report: parsed.full_report || finalContent,
        completed_at: new Date().toISOString(),
      })
      .eq('id', audit.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ 
      success: true, 
      audit_id: audit.id,
      ...parsed 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Audit error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
