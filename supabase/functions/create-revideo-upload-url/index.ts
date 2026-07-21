import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Authentication required");

    const { order_id, filename, file_size, mime_type } = await req.json();
    if (!order_id || !filename || !file_size || !mime_type) throw new Error("Missing required fields");
    if (!ALLOWED_MIME.includes(String(mime_type).toLowerCase())) {
      throw new Error("Only JPG, PNG or WEBP images are allowed");
    }
    if (Number(file_size) > MAX_FILE_SIZE) {
      throw new Error("File too large (max 10 MB)");
    }

    const { data: order, error: orderErr } = await supabase
      .from("revideo_orders")
      .select("id, user_id, status, photo_count")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) throw new Error("Order not found");

    if (order.user_id !== userData.user.id && !(await isAdmin(supabase, userData.user.id))) {
      throw new Error("Not your order");
    }
    if (!["awaiting_photos", "paid"].includes(order.status)) {
      throw new Error("Order must be paid before uploading photos");
    }

    const maxFiles = order.photo_count || 15;
    const { count } = await supabase
      .from("revideo_assets")
      .select("*", { count: "exact", head: true })
      .eq("order_id", order_id);
    if ((count || 0) >= maxFiles) {
      throw new Error("Maximum file count reached for this order");
    }

    const path = `${order_id}/${crypto.randomUUID()}-${filename}`;
    const { data: signed, error: signedErr } = await supabase.storage.from("revideo-assets").createSignedUploadUrl(path);
    if (signedErr || !signed?.signedUrl) throw signedErr || new Error("Could not create upload URL");

    const { error: assetErr } = await supabase.from("revideo_assets").insert({
      order_id,
      user_id: userData.user.id,
      storage_path: path,
      original_filename: filename,
      file_size_bytes: Number(file_size),
      mime_type,
    });
    if (assetErr) throw assetErr;

    return new Response(JSON.stringify({ signedUrl: signed.signedUrl, path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}
