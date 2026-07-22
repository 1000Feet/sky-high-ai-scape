import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PENDING_PER_HOUR = 5;

const productNames: Record<string, string> = {
  p7_hd:  "ReVideos — 7 Photos · Full HD",
  p15_hd: "ReVideos — 15 Photos · Full HD",
  p7_4k:  "ReVideos — 7 Photos · 4K",
  p15_4k: "ReVideos — 15 Photos · 4K",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
    if (!stripeSecret) throw new Error("Stripe is not configured");
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" as any });
    const supabase = createClient(supabaseUrl, serviceKey);

    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) userId = userData.user.id;
    }

    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await req.json();

    let order: any;

    if (body.order_id) {
      // Resume flow — order was created ahead of upload.
      const { data, error } = await supabase
        .from("revideo_orders")
        .select("*")
        .eq("id", body.order_id)
        .single();
      if (error || !data) throw new Error("Order not found");
      order = data;
    } else {
      // Legacy inline flow (kept for backward compatibility).
      const {
        package_name, price_cents, photo_count, resolution,
        customer_email, customer_name, special_requests, rights_accepted,
      } = body;
      if (!package_name || !price_cents || !photo_count || !resolution || !customer_email) {
        throw new Error("Missing required fields");
      }
      if (!rights_accepted) throw new Error("Photo rights confirmation required");
      if (Number(price_cents) <= 0) throw new Error("Invalid price");

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("revideo_checkout_attempts")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .eq("status", "pending")
        .gte("created_at", oneHourAgo);
      if ((count || 0) >= MAX_PENDING_PER_HOUR) {
        throw new Error("Too many checkout attempts from this IP. Please try again later.");
      }

      const inserted = await supabase
        .from("revideo_orders")
        .insert({
          user_id: userId,
          package_name, price_cents: Number(price_cents),
          photo_count: Number(photo_count), resolution,
          customer_email, customer_name: customer_name || null,
          special_requests: special_requests || "",
          rights_accepted: true,
          status: "awaiting_payment",
        })
        .select().single();
      if (inserted.error) throw inserted.error;
      order = inserted.data;

      await supabase.from("revideo_checkout_attempts").insert({
        ip_address: ip, order_id: order.id, status: "pending",
      });
    }

    const origin = req.headers.get("origin") || "https://www.1000feetabove.com";
    const productName = productNames[order.package_name] || `ReVideos ${order.package_name}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      managed_payments: { enabled: false } as any,
      customer_email: order.customer_email,
      line_items: [{
        price_data: {
          currency: "USD",
          product_data: {
            name: productName,
            description: `${order.photo_count} photos → 1 AI video · ${order.resolution} · 24h delivery`,
          },
          unit_amount: Number(order.price_cents),
        },
        quantity: 1,
      }],
      success_url: `${origin}/revideos/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${origin}/revideos`,
      metadata: { order_id: order.id, user_id: order.user_id ?? "" },
    });

    await supabase
      .from("revideo_orders")
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url, order_id: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-revideo-checkout error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
