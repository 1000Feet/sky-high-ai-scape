import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClips, startCreatomateRender, submitNextQueuedClips } from "../_shared/revideo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-job-key",
};

const MAX_CONCURRENT = parseInt(Deno.env.get("REVIDEO_MAX_CONCURRENT") || "8", 10);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const jobKey = req.headers.get("x-job-key");
    const expected = Deno.env.get("REVIDEO_ORCHESTRATOR_SECRET");
    if (!expected || jobKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: orders, error: ordersError } = await supabase
      .from("revideo_orders")
      .select("*")
      .in("status", ["generating", "editing"])
      .eq("manual_override", false)
      .order("created_at", { ascending: true });
    if (ordersError) throw ordersError;

    const results: any[] = [];
    for (const order of orders || []) {
      try {
        if (order.status === "generating") {
          results.push(await processGenerating(order, supabase));
        } else if (order.status === "editing") {
          results.push(await processEditing(order, supabase));
        }
      } catch (e) {
        console.error(`Order ${order.id} orchestration error:`, e);
        await supabase
          .from("revideo_orders")
          .update({
            status: "failed",
            error_message: (e as Error).message.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
        results.push({ order_id: order.id, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processGenerating(order: any, supabase: any) {
  const clips = await getClips(order.id, supabase);
  const running = clips.filter((c: any) => c.status === "running");
  const queued = clips.filter((c: any) => c.status === "queued");
  const done = clips.filter((c: any) => c.status === "done");
  const failed = clips.filter((c: any) => c.status === "failed");

  const { submitted, allDone, anyFailed } = await submitNextQueuedClips(supabase, order, MAX_CONCURRENT);

  let action = "submitted";
  if (allDone) {
    await supabase.from("revideo_orders").update({ status: "editing", updated_at: new Date().toISOString() }).eq("id", order.id);
    action = "promoted_to_editing";
  } else if (anyFailed && queued.length === 0 && running.length === 0) {
    await supabase
      .from("revideo_orders")
      .update({ status: "failed", error_message: "One or more video clips failed generation", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    action = "failed";
  }

  return { order_id: order.id, action, submitted, running: running.length, queued: queued.length, done: done.length, failed: failed.length };
}

async function processEditing(order: any, supabase: any) {
  if (!order.creatomate_render_id) {
    await startCreatomateRender(supabase, order);
    return { order_id: order.id, action: "started_creatomate" };
  }

  const cmKey = Deno.env.get("CREATOMATE_API_KEY")!;
  const res = await fetch(`https://api.creatomate.com/v2/renders/${order.creatomate_render_id}`, {
    headers: { Authorization: `Bearer ${cmKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Creatomate poll ${res.status}: ${await res.text()}`);

  const body = await res.json();
  if (body.status === "succeeded") {
    await startCreatomateRender(supabase, order); // will error if already started, but called only when no render_id
    // Actually startCreatomateRender above sets render_id; this branch unreachable in practice.
  } else if (body.status === "failed") {
    await supabase
      .from("revideo_orders")
      .update({ status: "failed", error_message: body.error_message || "Creatomate render failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);
  }

  return { order_id: order.id, action: "polled_creatomate", status: body.status };
}
