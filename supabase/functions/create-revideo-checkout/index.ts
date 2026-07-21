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

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      throw new Error("Authentication required");
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
    const { package_name, price_cents, property_address, property_type, special_requests } = body;
    if (!package_name || !price_cents || !property_address) {
      throw new Error("Missing required fields");
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
        property_address,
        property_type: property_type || "",
        special_requests: special_requests || "",
        status: "pending",
        payment_status: "pending",
        currency: "USD",
      })
      .select()
      .single();
    if (order.error) throw order.error;

    const origin = req.headers.get("origin") || "https://www.1000feetabove.com";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userData.user.email,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: `ReVideos ${package_name} Package`,
              description: property_address,
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
