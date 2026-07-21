import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-job-key",
};

const HIGGSFIELD_BASE_URL = "https://platform.higgsfield.ai";
const CREATOMATE_API_URL = "https://api.creatomate.com/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const jobKey = req.headers.get("x-job-key");
    const expected = Deno.env.get("REVIDEO_ORCHESTRATOR_SECRET");
    if (!expected || jobKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: orders, error: ordersError } = await supabase
      .from("revideo_orders")
      .select("*, clips:revideo_clips(*)")
      .in("status", ["generating", "editing"])
      .eq("manual_override", false)
      .order("created_at", { ascending: true });
    if (ordersError) throw ordersError;

    const results = [];
    for (const order of orders || []) {
      try {
        if (order.status === "generating") {
          results.push(await processGenerating(order, supabase));
        } else if (order.status === "editing") {
          results.push(await processEditing(order, supabase));
        }
      } catch (e) {
        console.error(`Order ${order.id} orchestration error:`, e);
        await supabase
          .from("revideo_orders")
          .update({
            status: "failed",
            error_message: (e as Error).message.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
        results.push({ order_id: order.id, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processGenerating(order: any, supabase: any) {
  const maxConcurrent = parseInt(Deno.env.get("REVIDEO_MAX_CONCURRENT") || "8", 10);
  const clips: any[] = order.clips || [];
  const running = clips.filter((c) => c.status === "running");
  const queued = clips.filter((c) => c.status === "queued").sort((a, b) => a.seq - b.seq);
  const done = clips.filter((c) => c.status === "done");
  const failed = clips.filter((c) => c.status === "failed");

  await pollRunningClips(running, supabase);

  const slots = Math.max(0, maxConcurrent - running.length);
  let submitted = 0;
  for (const clip of queued.slice(0, slots)) {
    try {
      await submitHiggsfieldClip(clip, order, supabase);
      submitted++;
    } catch (e) {
      console.error(`Failed to submit clip ${clip.id}:`, e);
    }
  }

  const refreshed = await getClips(order.id, supabase);
  const allDone = refreshed.length > 0 && refreshed.every((c) => c.status === "done");
  const anyFailed = refreshed.some((c) => c.status === "failed");
  const noPending = refreshed.every((c) => ["done", "failed"].includes(c.status));

  let action = "submitted";
  if (allDone) {
    await supabase.from("revideo_orders").update({ status: "editing", updated_at: new Date().toISOString() }).eq("id", order.id);
    action = "promoted_to_editing";
  } else if (anyFailed && noPending) {
    await supabase
      .from("revideo_orders")
      .update({ status: "failed", error_message: "One or more video clips failed generation", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    action = "failed";
  }

  return { order_id: order.id, action, submitted, running: running.length, queued: queued.length, done: done.length, failed: failed.length };
}

async function processEditing(order: any, supabase: any) {
  if (order.creatomate_render_id) {
    await pollCreatomateRender(order, supabase);
    return { order_id: order.id, action: "polled_creatomate" };
  }

  const clips = await getClips(order.id, supabase);
  const done = clips.filter((c) => c.status === "done").sort((a, b) => a.seq - b.seq);
  const notDone = clips.filter((c) => c.status !== "done");

  if (done.length === 0) return { order_id: order.id, action: "waiting_clips" };
  if (notDone.length > 0) return { order_id: order.id, action: "waiting_clips", done: done.length, pending: notDone.length };

  const missingVideo = done.find((c) => !c.video_url);
  if (missingVideo) throw new Error(`Clip ${missingVideo.id} is done but has no video URL`);

  const cmKey = Deno.env.get("CREATOMATE_API_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const webhookSecret = Deno.env.get("REVIDEO_WEBHOOK_SECRET")!;
  const webhookUrl = `${supabaseUrl}/functions/v1/revideo-creatomate-webhook?token=${encodeURIComponent(webhookSecret)}&order_id=${order.id}`;

  const dims = getDimensions(order.resolution);
  const elements = done.map((clip, index) => ({
    type: "video",
    source: clip.video_url,
    track: 1,
    animations: [
      {
        time: 0,
        duration: 0.6,
        transition: true,
        type: "fade",
        enable: "second-only",
      },
    ],
  }));

  const res = await fetch(`${CREATOMATE_API_URL}/renders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cmKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      output_format: "mp4",
      width: dims.width,
      height: dims.height,
      elements,
      webhook_url: webhookUrl,
      metadata: order.id,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Creatomate start failed ${res.status}: ${text}`);

  const body = JSON.parse(text);
  await supabase.from("revideo_orders").update({ creatomate_render_id: body.id, updated_at: new Date().toISOString() }).eq("id", order.id);

  return { order_id: order.id, action: "started_creatomate", render_id: body.id };
}

async function submitHiggsfieldClip(clip: any, order: any, supabase: any) {
  const key = Deno.env.get("HIGGSFIELD_API_KEY")!;
  const secret = Deno.env.get("HIGGSFIELD_API_SECRET")!;
  if (!key || !secret) throw new Error("Missing Higgsfield credentials");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const webhookSecret = Deno.env.get("REVIDEO_WEBHOOK_SECRET")!;
  const webhookUrl = `${supabaseUrl}/functions/v1/revideo-higgsfield-webhook?token=${encodeURIComponent(webhookSecret)}&clip_id=${clip.id}&order_id=${order.id}`;

  const { data: asset } = await supabase.from("revideo_assets").select("storage_path").eq("id", clip.asset_id).single();
  if (!asset) throw new Error("Asset not found for clip");

  const { data: signed, error: signedErr } = await supabase.storage.from("revideo-assets").createSignedUrl(asset.storage_path, 60 * 60 * 24);
  if (signedErr || !signed?.signedUrl) throw signedErr || new Error("Could not sign asset URL");

  const resolution = clip.resolution || "1080p";
  const input = {
    prompt: clip.prompt || "Cinematic real estate video",
    image_references: [{ type: "image_url", image_url: signed.signedUrl }],
    duration: clip.duration_seconds || 5,
    resolution,
    mode: "std",
    aspect_ratio: "16:9",
    generate_audio: true,
    genre: "auto",
  };

  const endpoint = `seedance_2_0`;
  const res = await fetch(`${HIGGSFIELD_BASE_URL}/${endpoint}?hf_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}:${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  if (!res.ok) {
    const nextAttempts = (clip.attempts || 0) + 1;
    const nextStatus = nextAttempts >= 3 ? "failed" : "retry";
    await supabase
      .from("revideo_clips")
      .update({ status: nextStatus, attempts: nextAttempts, error: `Higgsfield ${res.status}: ${text}`.slice(0, 500), updated_at: new Date().toISOString() })
      .eq("id", clip.id);
    throw new Error(`Higgsfield ${res.status}: ${text}`);
  }

  const body = JSON.parse(text);
  await supabase
    .from("revideo_clips")
    .update({ status: "running", higgsfield_job_id: body.request_id, attempts: (clip.attempts || 0) + 1, updated_at: new Date().toISOString() })
    .eq("id", clip.id);

  return body;
}

async function pollRunningClips(clips: any[], supabase: any) {
  const key = Deno.env.get("HIGGSFIELD_API_KEY")!;
  const secret = Deno.env.get("HIGGSFIELD_API_SECRET")!;
  if (!key || !secret) return;

  for (const clip of clips) {
    if (!clip.higgsfield_job_id) continue;
    try {
      const res = await fetch(`${HIGGSFIELD_BASE_URL}/requests/${clip.higgsfield_job_id}/status`, {
        headers: { Authorization: `Key ${key}:${secret}` },
      });
      if (!res.ok) {
        console.error(`Higgsfield poll ${clip.higgsfield_job_id} failed ${res.status}`);
        continue;
      }
      const body = await res.json();
      const status = body.status;
      if (!status) continue;

      const update: any = { updated_at: new Date().toISOString() };
      if (status === "completed") update.status = "done";
      else if (["failed", "nsfw"].includes(status)) update.status = "failed";
      else continue;

      if (body.video?.url) update.video_url = body.video.url;
      if (status === "failed") update.error = body.error || "Higgsfield generation failed";
      if (status === "nsfw") update.error = "NSFW content detected";

      await supabase.from("revideo_clips").update(update).eq("id", clip.id);
    } catch (e) {
      console.error(`Poll clip ${clip.id} error:`, e);
    }
  }
}

async function pollCreatomateRender(order: any, supabase: any) {
  const cmKey = Deno.env.get("CREATOMATE_API_KEY")!;
  const res = await fetch(`${CREATOMATE_API_URL}/renders/${order.creatomate_render_id}`, {
    headers: { Authorization: `Bearer ${cmKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Creatomate poll ${res.status}: ${await res.text()}`);

  const body = await res.json();
  if (body.status === "succeeded") {
    await finalizeDelivery(order, supabase, body.url);
  } else if (body.status === "failed") {
    await supabase
      .from("revideo_orders")
      .update({ status: "failed", error_message: body.error_message || "Creatomate render failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);
  }
}

async function getClips(orderId: string, supabase: any) {
  const { data, error } = await supabase.from("revideo_clips").select("*").eq("order_id", orderId).order("seq", { ascending: true });
  if (error) throw error;
  return data || [];
}

function getDimensions(resolution: string | null) {
  if (resolution === "4k") return { width: 3840, height: 2160 };
  return { width: 1920, height: 1080 };
}

async function finalizeDelivery(order: any, supabase: any, videoUrl: string) {
  const nowIso = new Date().toISOString();
  await supabase
    .from("revideo_orders")
    .update({
      status: "delivered",
      final_video_url: videoUrl,
      automation_completed_at: nowIso,
      delivered_urls: [videoUrl],
      updated_at: nowIso,
    })
    .eq("id", order.id);

  await sendDeliveryEmail(order, supabase, videoUrl);
}

async function sendDeliveryEmail(order: any, supabase: any, videoUrl: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!order.customer_email || !resendKey) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ReVideos <noreply@1000feetabove.com>",
        to: [order.customer_email],
        subject: "Your ReVideos property film is ready",
        html: `
          <h2>Your property film is ready</h2>
          <p>Hi there,</p>
          <p>Your <strong>${order.package_name}</strong> ReVideos order is complete and ready to download.</p>
          <p><a href="${videoUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Download your video</a></p>
          <p style="color:#64748b;font-size:13px;">If the button doesn't work, copy this link: ${videoUrl}</p>
          <p style="color:#64748b;font-size:13px;">Questions? Reply to this email or contact info@1000feetabove.com.</p>
        `,
      }),
    });
    if (res.ok) {
      await supabase.from("revideo_orders").update({ customer_notified_at: new Date().toISOString() }).eq("id", order.id);
    } else {
      console.error("Delivery email failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("Delivery email exception:", e);
  }
}
