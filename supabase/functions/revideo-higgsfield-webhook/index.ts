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

    const clipId = url.searchParams.get("clip_id");
    const orderId = url.searchParams.get("order_id");
    const body = await req.json();

    const status = body.status;
    const requestId = body.request_id;
    const videoUrl = body.video?.url;

    let targetClipId = clipId;
    if (!targetClipId && requestId) {
      const { data } = await supabase.from("revideo_clips").select("id").eq("higgsfield_job_id", requestId).single();
      if (data) targetClipId = data.id;
    }

    if (!targetClipId) {
      return new Response(JSON.stringify({ error: "Could not resolve clip" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const update: any = { updated_at: new Date().toISOString() };
    if (status === "completed") {
      update.status = "done";
      if (videoUrl) update.video_url = videoUrl;
    } else if (status === "failed" || status === "nsfw") {
      update.status = "failed";
      update.error = status === "nsfw" ? "NSFW content detected" : (body.error || "Higgsfield generation failed");
    } else {
      return new Response(JSON.stringify({ received: true, ignored: status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("revideo_clips").update(update).eq("id", targetClipId);
    if (error) throw error;

    return new Response(JSON.stringify({ received: true, clip_id: targetClipId, status: update.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
