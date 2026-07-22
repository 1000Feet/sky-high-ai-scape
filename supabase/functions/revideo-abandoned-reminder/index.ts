import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { sendAdminEmail } from "../_shared/revideo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Escalation schedule (hours since order creation). Max 3 reminders total.
const REMINDER_THRESHOLDS_HOURS = [3, 24, 72];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find abandoned orders: still awaiting_payment, > 3h old, with photos uploaded, < 3 reminders sent.
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: orders, error } = await supabase
      .from("revideo_orders")
      .select("*")
      .eq("status", "awaiting_payment")
      .lt("created_at", cutoff)
      .lt("abandoned_reminder_count", REMINDER_THRESHOLDS_HOURS.length);
    if (error) throw error;

    let sent = 0;
    const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" as any }) : null;

    for (const order of orders || []) {
      const hoursOld = (Date.now() - new Date(order.created_at).getTime()) / (60 * 60 * 1000);
      const nextIdx = order.abandoned_reminder_count || 0;
      const threshold = REMINDER_THRESHOLDS_HOURS[nextIdx];
      if (hoursOld < threshold) continue;

      // Photos must be uploaded (otherwise no urgency).
      const { count: assetCount } = await supabase
        .from("revideo_assets")
        .select("*", { count: "exact", head: true })
        .eq("order_id", order.id);
      if ((assetCount || 0) < (order.photo_count || 0)) continue;

      // Create or reuse a Stripe checkout link
      let paymentUrl: string | null = null;
      if (stripe) {
        try {
          const session = await stripe.checkout.sessions.create({
            mode: "payment",
            managed_payments: { enabled: false } as any,
            customer_email: order.customer_email,
            line_items: [{
              price_data: {
                currency: "USD",
                product_data: {
                  name: `ReVideos — ${order.package_name}`,
                  description: `${order.photo_count} photos → 1 AI video · ${order.resolution}`,
                },
                unit_amount: Number(order.price_cents),
              },
              quantity: 1,
            }],
            success_url: `https://www.1000feetabove.com/revideos/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
            cancel_url: `https://www.1000feetabove.com/revideos`,
            metadata: { order_id: order.id, user_id: order.user_id ?? "" },
          });
          paymentUrl = session.url;
        } catch (e) {
          console.error("stripe session failed for reminder", order.id, e);
        }
      }

      if (resendKey && paymentUrl) {
        const firstName = (order.customer_name || "").split(" ")[0] || "there";
        const subj = nextIdx === 0
          ? `Your ReVideo is ready to be produced — complete your order`
          : `Reminder: your ReVideos order is waiting`;
        const html = `
          <p>Hi ${firstName},</p>
          <p>Your photos for the <strong>${order.package_name}</strong> package are already uploaded and ready — we just need the payment to start producing your video.</p>
          <p><a href="${paymentUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Complete your purchase — $${(order.price_cents / 100).toFixed(0)}</a></p>
          <p>Once paid, your cinematic video is delivered within 24 hours.</p>
          <p>— The 1000 Feet team</p>
        `;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "ReVideos <noreply@1000feetabove.com>",
              to: [order.customer_email],
              subject: subj,
              html,
            }),
          });
          sent++;
        } catch (e) {
          console.error("reminder send failed", order.id, e);
          continue;
        }

        await supabase.from("revideo_orders").update({
          abandoned_reminder_count: (order.abandoned_reminder_count || 0) + 1,
          abandoned_reminder_sent_at: new Date().toISOString(),
        }).eq("id", order.id);

        try {
          await sendAdminEmail(
            resendKey,
            `ReVideos abandoned reminder #${nextIdx + 1} sent — order ${order.id.slice(0, 8)}`,
            `Customer: ${order.customer_name || "—"} &lt;${order.customer_email}&gt;<br>Package: ${order.package_name}<br>Photos: ${assetCount}/${order.photo_count} uploaded<br>Reminder #${nextIdx + 1} of ${REMINDER_THRESHOLDS_HOURS.length}`,
          );
        } catch (_) { /* non-fatal */ }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("revideo-abandoned-reminder error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
