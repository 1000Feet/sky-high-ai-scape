import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const ALLOWED: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif",
};
const MAX = 5 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Missing file" }, 400);
    const ext = ALLOWED[file.type];
    if (!ext) return json({ error: "Unsupported file type" }, 400);
    if (file.size > MAX) return json({ error: "File too large (max 5MB)" }, 400);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(name, file, { contentType: file.type, cacheControl: "3600" });
    if (error) { console.error(error); return json({ error: "Upload failed" }, 500); }
    const { data } = supabase.storage.from("logos").getPublicUrl(name);
    return json({ publicUrl: data.publicUrl });
  } catch (e) {
    console.error(e);
    return json({ error: "Upload failed" }, 500);
  }
});
