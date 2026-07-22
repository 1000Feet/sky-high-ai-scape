import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PENDING_PER_HOUR = 5;
const ALLOWED_PACKAGES = ["p7_hd", "p15_hd", "p7_4k", "p15_4k"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) userId = data.user.id;
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
      throw new Error("Too many pending orders from this IP. Please try again later.");
    }

    const body = await req.json();
    const {
      package_name, price_cents, photo_count, resolution,
      customer_name, customer_email, special_requests, rights_accepted,
    } = body;

    if (!package_name || !ALLOWED_PACKAGES.includes(package_name)) throw new Error("Invalid package");
    if (!price_cents || Number(price_cents) <= 0) throw new Error("Invalid price");
    if (!photo_count || ![7, 15].includes(Number(photo_count))) throw new Error("Invalid photo count");
    if (!resolution) throw new Error("Missing resolution");
    if (!customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer_email))) throw new Error("Invalid email");
    if (!customer_name || String(customer_name).trim().length < 2) throw new Error("Name is required");
    if (!rights_accepted) throw new Error("Photo rights confirmation required");

    const { data: order, error } = await supabase
      .from("revideo_orders")
      .insert({
        user_id: userId,
        package_name,
        price_cents: Number(price_cents),
        photo_count: Number(photo_count),
        resolution,
        customer_name: String(customer_name).trim().slice(0, 200),
        customer_email: String(customer_email).trim().toLowerCase().slice(0, 320),
        special_requests: String(special_requests || "").slice(0, 2000),
        rights_accepted: true,
        status: "awaiting_payment",
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("revideo_checkout_attempts").insert({
      ip_address: ip,
      order_id: order.id,
      status: "pending",
    });

    return new Response(JSON.stringify({ order_id: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-revideo-order error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
