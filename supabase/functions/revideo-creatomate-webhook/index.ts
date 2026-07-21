import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { finalizeDelivery } from "../_shared/revideo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const expected = Deno.env.get("REVIDEO_WEBHOOK_SECRET");
    if (!expected || token !== expected) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const orderId = url.searchParams.get("order_id") || body.metadata;
    const status = body.status;
    const videoUrl = body.url;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing order id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabase.from("revideo_orders").select("*").eq("id", orderId).single();
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status === "succeeded" || status === "done") {
      if (!videoUrl) throw new Error("Render succeeded but no URL returned");
      await finalizeDelivery(order, supabase, videoUrl);
    } else if (status === "failed") {
      await supabase
        .from("revideo_orders")
        .update({ status: "failed", error_message: body.error_message || "Creatomate render failed", updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    return new Response(JSON.stringify({ received: true, order_id: orderId, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
