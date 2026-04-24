import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, requestId } = await req.json();

    if (!sessionId || !requestId) {
      return new Response(JSON.stringify({ error: 'sessionId and requestId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_AGENTS_KEY')!;
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Check session status
    const statusResponse = await fetch(`https://api.anthropic.com/v1/sessions/${sessionId}`, {
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'managed-agents-2026-04-01',
      },
    });

    if (!statusResponse.ok) {
      const err = await statusResponse.text();
      return new Response(JSON.stringify({ error: `Failed to check session: ${err}`, agentStatus: 'error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const statusData = await statusResponse.json();
    const agentStatus = statusData.status;
    console.log(`Session ${sessionId} status: ${agentStatus}`);

    // If still running, return status without fetching transcript
    if (agentStatus === 'running' || agentStatus === 'processing') {
      return new Response(JSON.stringify({ success: true, agentStatus, message: 'Agent is still working...' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If failed
    if (agentStatus === 'failed' || agentStatus === 'error') {
      await sb.from('website_requests').update({
        generation_status: 'failed',
        generation_error: 'Agent session failed',
        generation_completed_at: new Date().toISOString(),
      }).eq('id', requestId);

      return new Response(JSON.stringify({ success: false, agentStatus, error: 'Agent session failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Agent completed (idle/completed/ended) - fetch transcript
    const transcriptResponse = await fetch(`https://api.anthropic.com/v1/sessions/${sessionId}/events`, {
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'managed-agents-2026-04-01',
      },
    });

    if (!transcriptResponse.ok) {
      const err = await transcriptResponse.text();
      return new Response(JSON.stringify({ error: `Failed to fetch transcript: ${err}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const events = await transcriptResponse.json();
    const eventList = events.data || events.events || events || [];
    const allEvents = Array.isArray(eventList) ? eventList : [];

    // Search for code containing "function App()" in any event
    let codeFound: string | null = null;

    for (const evt of allEvents) {
      const contents = [evt.content, evt.text, evt.input];
      for (const content of contents) {
        if (!content) continue;
        if (typeof content === 'string' && content.includes('function App()')) {
          if (!codeFound || content.length > codeFound.length) codeFound = content;
        }
        if (Array.isArray(content)) {
          for (const block of content) {
            const text = block?.text || block?.content || (typeof block === 'string' ? block : '');
            if (typeof text === 'string' && text.includes('function App()')) {
              if (!codeFound || text.length > codeFound.length) codeFound = text;
            }
          }
        }
        if (typeof content === 'object' && !Array.isArray(content)) {
          const nested = content.content || content.text || content.code || '';
          if (typeof nested === 'string' && nested.includes('function App()')) {
            if (!codeFound || nested.length > codeFound.length) codeFound = nested;
          }
        }
      }
      if (evt.type === 'agent.tool_use' && evt.input) {
        try {
          const parsed = typeof evt.input === 'string' ? JSON.parse(evt.input) : evt.input;
          const code = parsed.content || parsed.code || parsed.text || '';
          if (code && code.includes('function App()') && (!codeFound || code.length > codeFound.length)) {
            codeFound = code;
          }
        } catch {}
      }
    }

    if (!codeFound) {
      await sb.from('website_requests').update({
        generation_status: 'failed',
        generation_error: 'Agent produced no usable code',
        generation_completed_at: new Date().toISOString(),
      }).eq('id', requestId);

      const debug = allEvents.map((e: any, i: number) => ({
        i, type: e.type,
        contentPreview: typeof e.content === 'string' ? e.content.slice(0, 80) :
                        Array.isArray(e.content) ? e.content.map((b: any) => (b.text || '').slice(0, 80)) :
                        e.content ? 'object' : 'none'
      }));

      return new Response(JSON.stringify({ success: false, agentStatus, error: 'No code found in agent output', debug }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean code
    let cleanCode = codeFound;
    cleanCode = cleanCode.replace(/```(?:jsx?|tsx?|typescript|react)?\n?/g, '');
    cleanCode = cleanCode.replace(/```\n?/g, '');
    cleanCode = cleanCode.split('\n').map((line: string) => line.replace(/^\d+\t/, '')).join('\n');
    cleanCode = cleanCode.trim();

    console.log(`Successfully extracted ${cleanCode.length} chars of React code`);

    // Save to DB
    await sb.from('website_requests').update({
      generated_code: cleanCode,
      generation_status: 'completed',
      generation_completed_at: new Date().toISOString(),
      generation_error: null,
    }).eq('id', requestId);

    return new Response(JSON.stringify({
      success: true,
      agentStatus,
      codeLength: cleanCode.length,
      preview: cleanCode.slice(0, 200),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
