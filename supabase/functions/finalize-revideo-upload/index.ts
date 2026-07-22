import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { startProductionIfReady } from "../_shared/revideo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Optional auth: guest orders may finalize using order_id as capability
    // (same pattern as create-revideo-upload-url).
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) userId = data.user.id;
    }

    const { order_id } = await req.json();
    if (!order_id) throw new Error("Missing order_id");

    const { data: order, error: orderErr } = await supabase
      .from("revideo_orders").select("*").eq("id", order_id).single();
    if (orderErr || !order) throw new Error("Order not found");

    if (order.user_id && order.user_id !== userId) {
      if (!userId) throw new Error("Not your order");
      const { data: admin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!admin) throw new Error("Not your order");
    }

    const { count } = await supabase
      .from("revideo_assets")
      .select("*", { count: "exact", head: true })
      .eq("order_id", order_id);

    if ((count || 0) < (order.photo_count || 0)) {
      return new Response(JSON.stringify({ ready: false, uploaded: count || 0, required: order.photo_count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only start production if payment is confirmed (awaiting_photos or paid).
    // For awaiting_payment orders we wait for verify-revideo-payment to trigger it.
    if (!["awaiting_photos", "paid", "generating", "editing", "delivered"].includes(order.status)) {
      return new Response(JSON.stringify({ ready: true, awaiting_payment: true, status: order.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await startProductionIfReady(supabase, order, resendKey);
    return new Response(JSON.stringify({ ready: true, status: result.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
