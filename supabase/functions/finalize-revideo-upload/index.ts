import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Authentication required");

    const { order_id } = await req.json();
    if (!order_id) throw new Error("Missing order_id");

    const { data: order, error: orderErr } = await supabase
      .from("revideo_orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) throw new Error("Order not found");
    if (order.user_id !== userData.user.id) {
      const { data: admin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
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

    if (["generating", "editing", "delivered"].includes(order.status)) {
      return new Response(JSON.stringify({ ready: true, status: order.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const automationEnabled = Deno.env.get("REVIDEO_AUTOMATION_ENABLED") !== "false";
    const nowIso = new Date().toISOString();

    if (automationEnabled) {
      const { count: clipCount } = await supabase
        .from("revideo_clips")
        .select("*", { count: "exact", head: true })
        .eq("order_id", order_id);

      if ((clipCount || 0) === 0) {
        const { data: assets } = await supabase
          .from("revideo_assets")
          .select("*")
          .eq("order_id", order_id)
          .order("uploaded_at", { ascending: true });

        const basePrompt = buildPrompt(order);
        const clips = (assets || []).map((asset, idx) => ({
          order_id,
          asset_id: asset.id,
          seq: idx + 1,
          model: "seedance_2_0",
          mode: "std",
          resolution: order.resolution || "1080p",
          duration_seconds: 5,
          prompt: basePrompt,
          status: "queued",
        }));

        const { error: clipsErr } = await supabase.from("revideo_clips").insert(clips);
        if (clipsErr) throw clipsErr;
      }

      await supabase
        .from("revideo_orders")
        .update({
          status: "generating",
          photos_uploaded_at: order.photos_uploaded_at || nowIso,
          automation_started_at: nowIso,
          admin_notified_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", order_id);
    } else {
      if (order.status === "awaiting_photos") {
        await supabase
          .from("revideo_orders")
          .update({ status: "paid", photos_uploaded_at: nowIso, admin_notified_at: nowIso, updated_at: nowIso })
          .eq("id", order_id);
      }

      if (resendKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "ReVideos <noreply@1000feetabove.com>",
              to: ["info@1000feetabove.com"],
              subject: `ReVideos: order #${order_id.slice(0, 8)} ready to process`,
              html: `
                <h2>Order ready to process</h2>
                <p><strong>Order:</strong> ${order_id}</p>
                <p><strong>Package:</strong> ${order.package_name} (${order.photo_count} photos · ${order.resolution})</p>
                <p><strong>Customer:</strong> ${order.customer_email}</p>
                <p><strong>Notes:</strong> ${order.special_requests || "—"}</p>
                <p>All photos uploaded. Open the admin dashboard to launch production.</p>
              `,
            }),
          });
        } catch (e) {
          console.error("Admin email failed:", e);
        }
      }
    }

    return new Response(JSON.stringify({ ready: true, status: automationEnabled ? "generating" : order.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildPrompt(order: any) {
  const address = order.property_address ? `of ${order.property_address}` : "";
  const type = order.property_type ? ` (${order.property_type})` : "";
  return `Cinematic real estate video ${address}${type}. Smooth, elegant camera movement, warm natural light, professional architectural photography, no people or pets, dreamy modern atmosphere.`.trim();
}
