import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function finalizeDelivery(order: any, supabase: any, videoUrl: string) {
  const nowIso = new Date().toISOString();
  await supabase
    .from("revideo_orders")
    .update({
      status: "delivered",
      final_video_url: videoUrl,
      automation_completed_at: nowIso,
      delivered_urls: [videoUrl],
      updated_at: nowIso,
    })
    .eq("id", order.id);

  await sendDeliveryEmail(order, supabase, videoUrl);
}

async function sendDeliveryEmail(order: any, supabase: any, videoUrl: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!order.customer_email || !resendKey) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ReVideos <noreply@1000feetabove.com>",
        to: [order.customer_email],
        subject: "Your ReVideos property film is ready",
        html: `
          <h2>Your property film is ready</h2>
          <p>Hi there,</p>
          <p>Your <strong>${order.package_name}</strong> ReVideos order is complete and ready to download.</p>
          <p><a href="${videoUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Download your video</a></p>
          <p style="color:#64748b;font-size:13px;">If the button doesn't work, copy this link: ${videoUrl}</p>
          <p style="color:#64748b;font-size:13px;">Questions? Reply to this email or contact info@1000feetabove.com.</p>
        `,
      }),
    });
    if (res.ok) {
      await supabase.from("revideo_orders").update({ customer_notified_at: new Date().toISOString() }).eq("id", order.id);
    } else {
      console.error("Delivery email failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("Delivery email exception:", e);
  }
}
