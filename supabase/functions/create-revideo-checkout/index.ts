import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PENDING_PER_HOUR = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
    if (!stripeSecret) {
      throw new Error("Stripe is not configured");
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" as any });
    const supabase = createClient(supabaseUrl, serviceKey);

    // Optional auth: associate order to a user if a valid JWT is provided; otherwise allow guest checkout.
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) userId = userData.user.id;
    }

    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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

    const body = await req.json();
    const {
      package_name,
      price_cents,
      photo_count,
      resolution,
      customer_email,
      special_requests,
      rights_accepted,
    } = body;
    if (!package_name || !price_cents || !photo_count || !resolution || !customer_email) {
      throw new Error("Missing required fields");
    }
    if (!rights_accepted) {
      throw new Error("Photo rights confirmation required");
    }
    if (Number(price_cents) <= 0) {
      throw new Error("Invalid price");
    }

    const order = await supabase
      .from("revideo_orders")
      .insert({
        user_id: userData.user.id,
        package_name,
        price_cents: Number(price_cents),
        photo_count: Number(photo_count),
        resolution,
        customer_email,
        special_requests: special_requests || "",
        rights_accepted: true,
        status: "pending",
      })
      .select()
      .single();
    if (order.error) throw order.error;

    const origin = req.headers.get("origin") || "https://www.1000feetabove.com";
    const productNames: Record<string, string> = {
      p7_hd:  "ReVideos — 7 Photos · Full HD",
      p15_hd: "ReVideos — 15 Photos · Full HD",
      p7_4k:  "ReVideos — 7 Photos · 4K",
      p15_4k: "ReVideos — 15 Photos · 4K",
    };
    const productName = productNames[package_name] || `ReVideos ${package_name}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer_email,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: productName,
              description: `${photo_count} photos → 1 AI video · ${resolution} · 24h delivery`,
            },
            unit_amount: Number(price_cents),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/revideos/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.data.id}`,
      cancel_url: `${origin}/revideos`,
      metadata: { order_id: order.data.id, user_id: userData.user.id },
    });

    await supabase.from("revideo_checkout_attempts").insert({
      ip_address: ip,
      order_id: order.data.id,
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
