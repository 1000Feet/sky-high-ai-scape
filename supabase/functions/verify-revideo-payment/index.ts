import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { sendAdminEmail, startProductionIfReady } from "../_shared/revideo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!stripeSecret) throw new Error("Stripe is not configured");
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" as any });
    const supabase = createClient(supabaseUrl, serviceKey);

    const { session_id, order_id } = await req.json();
    if (!session_id && !order_id) throw new Error("Missing session_id or order_id");

    let order;
    if (session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const orderId = session.metadata?.order_id;
      if (!orderId) throw new Error("No order linked to session");

      const { data: existing } = await supabase
        .from("revideo_orders").select("*").eq("id", orderId).single();

      const isPaid = session.payment_status === "paid";
      const alreadyAdvanced = existing && !["pending", "awaiting_payment"].includes(existing.status);
      const newStatus = isPaid && !alreadyAdvanced ? "awaiting_photos" : (existing?.status ?? "pending");

      const { data, error } = await supabase
        .from("revideo_orders")
        .update({
          status: newStatus,
          stripe_checkout_session_id: session_id,
          stripe_payment_intent_id: (session.payment_intent as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId).select().single();
      if (error) throw error;
      order = data;

      if (newStatus === "awaiting_photos" && !existing?.admin_notified_at && resendKey) {
        await sendAdminEmail(
          resendKey,
          `New ReVideos order #${order.id.slice(0, 8)}`,
          `A new ${order.package_name} order was paid.<br>Customer: ${order.customer_name || "—"} &lt;${order.customer_email || "—"}&gt;<br>Amount: $${(order.price_cents / 100).toFixed(2)}`,
        );
        await supabase.from("revideo_orders").update({ admin_notified_at: new Date().toISOString() }).eq("id", order.id);
      }

      // Photos may already be uploaded (pre-checkout flow) — auto-start production.
      if (newStatus === "awaiting_photos") {
        try {
          const result = await startProductionIfReady(supabase, order, resendKey);
          if (result.started && result.status !== order.status) {
            const { data: refreshed } = await supabase
              .from("revideo_orders").select("*").eq("id", order.id).single();
            if (refreshed) order = refreshed;
          }
        } catch (e) {
          console.error("auto-start production failed:", e);
        }
      }
    } else {
      const { data, error } = await supabase.from("revideo_orders").select("*").eq("id", order_id).single();
      if (error) throw error;
      order = data;
    }

    const { data: assets } = await supabase.from("revideo_assets").select("*").eq("order_id", order.id);
    return new Response(JSON.stringify({ order, assets: assets || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
