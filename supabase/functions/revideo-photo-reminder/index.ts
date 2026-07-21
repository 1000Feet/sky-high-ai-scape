import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEADLINE_HOURS = 48;
const REMINDER_INTERVALS_HOURS = [24, 12, 4, 1]; // hours before deadline

const ADMIN_EMAIL = "info@1000feetabove.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const { data: orders, error: fetchError } = await supabase
      .from("revideo_orders")
      .select("*")
      .in("status", ["awaiting_photos", "paid"])
      .is("photos_uploaded_at", null)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    let sent = 0;
    for (const order of orders || []) {
      const deadline = new Date(order.created_at);
      deadline.setHours(deadline.getHours() + DEADLINE_HOURS);
      const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      const count = order.reminder_count || 0;
      const lastReminder = order.last_reminder_sent_at ? new Date(order.last_reminder_sent_at).getTime() : 0;
      const hoursSinceLastReminder = lastReminder ? (now.getTime() - lastReminder) / (1000 * 60 * 60) : Infinity;

      const nextIndex = count; // 0-based, so first reminder is 24h before deadline
      if (nextIndex >= REMINDER_INTERVALS_HOURS.length) continue;

      const dueHours = REMINDER_INTERVALS_HOURS[nextIndex];
      if (hoursRemaining <= dueHours && hoursSinceLastReminder >= 1) {
        const hoursLeft = Math.max(0, Math.round(hoursRemaining));
        const success = await sendReminderEmail(resendKey, order, hoursLeft, dueHours);
        if (success) {
          await supabase
            .from("revideo_orders")
            .update({
              reminder_count: count + 1,
              last_reminder_sent_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", order.id);
          sent++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendReminderEmail(resendKey: string, order: any, hoursLeft: number, dueHours: number): Promise<boolean> {
  try {
    const deadlineText = dueHours === 1 ? "1 hour" : `${dueHours} hours`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ReVideos <noreply@1000feetabove.com>",
        to: [order.customer_email],
        bcc: [ADMIN_EMAIL],
        subject: `Reminder: upload your photos (${hoursLeft} hours left)`,
        html: `
          <h2>Don't forget your photos</h2>
          <p>Hi there,</p>
          <p>You ordered the <strong>${order.package_name}</strong> ReVideos package for ${order.property_address || "your property"}.</p>
          <p>You now have about <strong>${hoursLeft} hours</strong> left to upload your photos so we can keep the 24-hour delivery promise.</p>
          <p><a href="https://1000feetabove.com/revideos/success?order_id=${order.id}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Upload photos</a></p>
          <p style="color:#64748b;font-size:13px;">Questions? Reply to this email or contact info@1000feetabove.com.</p>
        `,
      }),
    });
    if (!res.ok) {
      console.error("Reminder email failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Reminder email exception:", e);
    return false;
  }
}
