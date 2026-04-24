import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENT_ID = 'agent_011Ca1sxNJYS854K3VLAnGGZ';
const ENVIRONMENT_ID = 'env_01NK631iuUhUr36YPQnesg8Z';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mockupUrl, businessName, businessType, colorPalette, notes, requestId } = await req.json();

    if (!mockupUrl && !notes) {
      return new Response(JSON.stringify({ error: 'Either mockupUrl or notes are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'requestId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_AGENTS_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_AGENTS_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Creating Managed Agent session for: ${businessName}`);

    // Create session
    const sessionResponse = await fetch('https://api.anthropic.com/v1/sessions', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'managed-agents-2026-04-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent: AGENT_ID, environment_id: ENVIRONMENT_ID }),
    });

    if (!sessionResponse.ok) {
      const errText = await sessionResponse.text();
      console.error('Session creation error:', errText);
      return new Response(JSON.stringify({ error: `Failed to create agent session: ${sessionResponse.status}`, details: errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await sessionResponse.json();
    const sessionId = session.id;
    console.log(`Session created: ${sessionId}`);

    // Send event
    const clientNotes = notes ? `\nClient notes & feedback:\n${notes}\n\nIMPORTANT: The client provided specific feedback above. Incorporate their preferences into the design.` : '';

    const baseInstruction = mockupUrl
      ? `Convert this mockup into a pixel-perfect React component using Tailwind CSS.\n- Match the mockup EXACTLY: colors, typography, spacing, layout, visual effects\n- Include ALL sections visible in the mockup`
      : `Create a professional, modern React website component using Tailwind CSS based on the client's description below.`;

    const userMessage = `${baseInstruction}
Business name: ${businessName || 'Unknown'}
Business type: ${businessType || 'General'}
Color palette: ${colorPalette || 'Use a modern, professional palette'}
${clientNotes}

Requirements:
- Single function component named "App", no imports needed (React 18 via CDN)
- Use React.useState, React.useEffect, React.useRef etc. (NOT destructured imports)
- Use ONLY Tailwind CSS utility classes (via CDN)
- Add hover effects on buttons and interactive elements with smooth transitions
- Make it fully responsive (mobile-first with sm/md/lg breakpoints)
- Use inline SVG icons where needed
- Professional polish: smooth transitions, subtle shadows, proper spacing
- Use placeholder images from https://placehold.co/ with appropriate dimensions

Output ONLY the raw JavaScript code for the React component. No markdown fences, no explanations, no commentary. Just the code starting with function App() {`;

    const eventResponse = await fetch(`https://api.anthropic.com/v1/sessions/${sessionId}/events`, {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'managed-agents-2026-04-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: [{
          type: 'user.message',
          content: [
            ...(mockupUrl ? [{ type: 'image', source: { type: 'url', url: mockupUrl } }] : []),
            { type: 'text', text: userMessage },
          ],
        }],
      }),
    });

    if (!eventResponse.ok) {
      const errText = await eventResponse.text();
      console.error('Event send error:', errText);
      return new Response(JSON.stringify({ error: `Failed to send event: ${eventResponse.status}`, details: errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Event sent successfully. Session ID saved to DB.');

    // Save session ID and status to DB - NO background polling
    await sb.from('website_requests').update({
      generation_session_id: sessionId,
      generation_status: 'processing',
      generation_started_at: new Date().toISOString(),
      generation_error: null,
      generated_code: null,
    }).eq('id', requestId);

    // Return immediately with session ID
    return new Response(JSON.stringify({ success: true, status: 'processing', sessionId }), {
      status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in convert-mockup-to-code:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
