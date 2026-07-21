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

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: orders, error } = await supabase
      .from("revideo_orders")
      .select("id, customer_email, package_name, photo_count")
      .eq("status", "awaiting_photos")
      .is("reminder_sent_at", null)
      .lt("created_at", cutoff);
    if (error) throw error;

    let sent = 0;
    for (const o of orders || []) {
      if (!o.customer_email || !resendKey) continue;
      const link = `https://www.1000feetabove.com/revideos/success?order_id=${o.id}`;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ReVideos <noreply@1000feetabove.com>",
            to: [o.customer_email],
            subject: "Upload your photos to start your video",
            html: `
              <h2>Your ReVideos order is waiting for photos</h2>
              <p>We received your payment for the <strong>${o.package_name}</strong> package (${o.photo_count} photos), but haven't received your photos yet.</p>
              <p>Once you upload them, we'll deliver your cinematic video within 24 hours.</p>
              <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Upload photos</a></p>
              <p style="color:#64748b;font-size:13px;">If you need help, reply to this email or write to info@1000feetabove.com.</p>
            `,
          }),
        });
        if (res.ok) {
          await supabase.from("revideo_orders").update({ reminder_sent_at: new Date().toISOString() }).eq("id", o.id);
          sent++;
        }
      } catch (e) {
        console.error("Reminder failed for order", o.id, e);
      }
    }

    return new Response(JSON.stringify({ candidates: orders?.length ?? 0, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
