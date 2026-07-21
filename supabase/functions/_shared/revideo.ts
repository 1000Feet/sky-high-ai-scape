const HIGGSFIELD_BASE_URL = "https://platform.higgsfield.ai";
const CREATOMATE_API_URL = "https://api.creatomate.com/v2";

export function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function buildPrompt(order: any): string {
  const address = order.property_address ? `of ${order.property_address}` : "";
  const type = order.property_type ? ` (${order.property_type})` : "";
  return `Cinematic real estate video ${address}${type}. Smooth, elegant camera movement, warm natural light, professional architectural photography, no people or pets, dreamy modern atmosphere.`.trim();
}

export async function submitHiggsfieldClip(
  supabase: any,
  clip: any,
  order: any,
): Promise<any> {
  const key = getEnv("HIGGSFIELD_API_KEY");
  const secret = getEnv("HIGGSFIELD_API_SECRET");
  const supabaseUrl = getEnv("SUPABASE_URL");
  const webhookSecret = getEnv("REVIDEO_WEBHOOK_SECRET");
  const webhookUrl = `${supabaseUrl}/functions/v1/revideo-higgsfield-webhook?token=${encodeURIComponent(webhookSecret)}&clip_id=${clip.id}&order_id=${order.id}`;

  const { data: asset, error: assetErr } = await supabase
    .from("revideo_assets")
    .select("storage_path")
    .eq("id", clip.asset_id)
    .single();
  if (assetErr || !asset) throw assetErr || new Error("Asset not found for clip");

  const { data: signed, error: signedErr } = await supabase.storage
    .from("revideo-assets")
    .createSignedUrl(asset.storage_path, 60 * 60 * 24);
  if (signedErr || !signed?.signedUrl) throw signedErr || new Error("Could not sign asset URL");

  const resolution = clip.resolution || "1080p";
  const input = {
    prompt: clip.prompt || buildPrompt(order),
    image_references: [{ type: "image_url", image_url: signed.signedUrl }],
    duration: clip.duration_seconds || 5,
    resolution,
    mode: "std",
    aspect_ratio: "16:9",
    generate_audio: true,
    genre: "auto",
  };

  const endpoint = "seedance_2_0";
  const res = await fetch(`${HIGGSFIELD_BASE_URL}/${endpoint}?hf_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}:${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  const attempts = (clip.attempts || 0) + 1;
  if (!res.ok) {
    const nextStatus = attempts >= 3 ? "failed" : "queued";
    await supabase
      .from("revideo_clips")
      .update({ status: nextStatus, attempts, error: `Higgsfield ${res.status}: ${text}`.slice(0, 500), updated_at: new Date().toISOString() })
      .eq("id", clip.id);
    throw new Error(`Higgsfield ${res.status}: ${text}`);
  }

  const body = JSON.parse(text);
  await supabase
    .from("revideo_clips")
    .update({ status: "running", higgsfield_job_id: body.request_id, attempts, updated_at: new Date().toISOString() })
    .eq("id", clip.id);

  return body;
}

export async function getClips(orderId: string, supabase: any): Promise<any[]> {
  const { data, error } = await supabase.from("revideo_clips").select("*").eq("order_id", orderId).order("seq", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function submitNextQueuedClips(
  supabase: any,
  order: any,
  maxConcurrent: number,
): Promise<{ submitted: number; allDone: boolean; anyFailed: boolean }> {
  const clips = await getClips(order.id, supabase);
  const running = clips.filter((c) => c.status === "running");
  const queued = clips.filter((c) => c.status === "queued").sort((a, b) => a.seq - b.seq);
  const slots = Math.max(0, maxConcurrent - running.length);
  let submitted = 0;

  for (const clip of queued.slice(0, slots)) {
    try {
      await submitHiggsfieldClip(supabase, clip, order);
      submitted++;
    } catch (e) {
      console.error(`Failed to submit clip ${clip.id}:`, e);
    }
  }

  const refreshed = await getClips(order.id, supabase);
  const allDone = refreshed.length > 0 && refreshed.every((c) => c.status === "done");
  const anyFailed = refreshed.some((c) => c.status === "failed");

  return { submitted, allDone, anyFailed };
}

export function getDimensions(resolution: string | null): { width: number; height: number } {
  if (resolution === "4k") return { width: 3840, height: 2160 };
  return { width: 1920, height: 1080 };
}

export async function startCreatomateRender(supabase: any, order: any): Promise<any> {
  const cmKey = getEnv("CREATOMATE_API_KEY");
  const supabaseUrl = getEnv("SUPABASE_URL");
  const webhookSecret = getEnv("REVIDEO_WEBHOOK_SECRET");
  const webhookUrl = `${supabaseUrl}/functions/v1/revideo-creatomate-webhook?token=${encodeURIComponent(webhookSecret)}&order_id=${order.id}`;

  const clips = await getClips(order.id, supabase);
  const done = clips.filter((c) => c.status === "done").sort((a, b) => a.seq - b.seq);
  if (done.length === 0) throw new Error("No clips ready for final render");
  if (!done.every((c) => c.video_url)) throw new Error("Some done clips are missing video URLs");

  const dims = getDimensions(order.resolution);
  const elements = done.map((clip) => ({
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
  await supabase
    .from("revideo_orders")
    .update({ creatomate_render_id: body.id, status: "editing", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  return body;
}

export async function finalizeDelivery(order: any, supabase: any, videoUrl: string): Promise<void> {
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

export async function sendDeliveryEmail(order: any, supabase: any, videoUrl: string): Promise<void> {
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
