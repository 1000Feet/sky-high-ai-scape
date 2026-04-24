import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const callImageModel = async (LOVABLE_API_KEY: string, userContent: any[]) => {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{ role: "user", content: userContent }],
      modalities: ["image", "text"],
    }),
  });
};

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

/** Upload a base64 data URL to Supabase Storage and return the public URL */
async function uploadBase64ToStorage(base64Data: string): Promise<string> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Parse base64 data URL
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/s);
  if (!matches) throw new Error("Invalid base64 data URL");

  const mimeType = matches[1];
  const base64Content = matches[2];

  // Decode base64 to binary
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = mimeType.includes("png") ? "png" : "jpg";
  const fileName = `mockup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("mockups")
    .upload(fileName, bytes.buffer, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("mockups")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, businessType, colorPalette, logoUrl, mode } = await req.json();
    const safeBusinessName = (businessName || "New Business").trim() || "New Business";
    const businessTypeLabel = (businessType || "business").toLowerCase();
    const hasUsableLogo = typeof logoUrl === "string" && isHttpUrl(logoUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonResponse({ success: false, error: "LOVABLE_API_KEY not configured", errorCode: "config" }, 500);
    }

    const colorDesc = colorPalette || "blue and white";

    // --- Pick Colors Mode ---
    if (mode === 'pick-colors') {
      const colorPrompt = `You are a professional web designer. A client has a ${businessTypeLabel} business called "${safeBusinessName}".

Choose the PERFECT 4-color palette for their website. Consider the industry, target audience, and brand psychology.

Return ONLY a JSON object with this exact format, no other text:
{"colors": ["#primary", "#primaryDark", "#background", "#text"]}

- primary: main brand color (buttons, accents)
- primaryDark: darker variant of primary
- background: page background (light or dark)
- text: main text color (must contrast with background)

Make bold, unique choices — not generic blues. Think about what colors convey trust, energy, or luxury for a ${businessTypeLabel} business.`;

      const colorResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: colorPrompt }],
        }),
      });

      if (!colorResponse.ok) {
        const status = colorResponse.status;
        const errText = await colorResponse.text();
        console.error(`Color AI error [${status}]:`, errText);
        if (status === 429) return jsonResponse({ success: false, error: "Rate limited.", errorCode: "rate_limit" }, 429);
        if (status === 402) return jsonResponse({ success: false, error: "AI credits exhausted.", errorCode: "credits" }, 402);
        return jsonResponse({ success: false, error: `AI error: ${status}`, errorCode: "ai_error" }, 500);
      }

      const colorData = await colorResponse.json();
      const text = colorData.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*?"colors"[\s\S]*?\}/);
      if (!jsonMatch) {
        console.error("Could not parse color response:", text);
        return jsonResponse({ success: false, error: "Could not parse AI color response", errorCode: "parse_error" }, 500);
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return jsonResponse({ success: true, colors: parsed.colors });
    }

    // --- Image Generation ---
    const buildPrompt = (includeLogoReference: boolean) => {
      if (mode === 'hero-image') {
        return `Create a stunning, cinematic hero background image for a ${businessTypeLabel} website called "${safeBusinessName}".

REQUIREMENTS:
- Beautiful, atmospheric, professional photograph or illustration
- Relevant to the ${businessTypeLabel} industry
- Subtle color tones matching ${colorDesc} palette
- Wide landscape format, suitable as a website hero background
- No text, no UI elements, no buttons — just a beautiful visual
- High quality, modern, editorial style
- Slightly dark/moody to allow white text overlay
- Depth of field, dramatic lighting, professional composition`;
      }

      return `Create a ultra-realistic, pixel-perfect FULL website homepage screenshot for "${safeBusinessName}".
The image should be in PORTRAIT/VERTICAL orientation (tall, like a phone screenshot of a full scrolling page).

BUSINESS INFO:
- Type: ${businessType || "general business"}
- Color scheme: ${colorDesc}

DESIGN REQUIREMENTS:
- Modern, clean SaaS/startup style landing page (similar to Lovable, Linear, Vercel aesthetic)
- Full browser window chrome at the top (address bar showing "${safeBusinessName.toLowerCase().replace(/\s+/g, '')}.com")
- Sticky navigation bar with the business name/logo on the left, menu items (Home, About, Services, Contact) on the right, and a CTA button
- Large hero section with a bold headline, subtext, and a prominent call-to-action button
- Use the specified color palette: primary buttons and accents in ${colorDesc}, clean white/light background, dark text
- Feature cards section with 3-4 cards showing services/features with icons
- Testimonials or trust section
- Clean footer with links and contact info
- Subtle gradients, rounded corners, soft shadows — modern UI design
- Typography: clean sans-serif (Inter/Poppins style), proper hierarchy
- Generous whitespace, professional spacing
- Make it look like a REAL production website, not a wireframe or sketch
- IMPORTANT: The image must be TALL/VERTICAL (portrait), showing the FULL page from navigation to footer as if you scrolled the entire page
${includeLogoReference ? "- CRITICAL: Incorporate the provided logo image prominently in the navigation bar and possibly the footer. Match the website's color scheme to complement the logo." : ""}
- The screenshot should be high resolution and look exactly like what you'd see when visiting a real website`;
    };

    const userContent: any[] = [{ type: "text", text: buildPrompt(hasUsableLogo) }];
    
    if (hasUsableLogo) {
      userContent.push({
        type: "image_url",
        image_url: { url: logoUrl },
      });
    } else if (logoUrl) {
      console.warn("Skipping logo because it is not a valid http(s) URL");
    }

    let response = await callImageModel(LOVABLE_API_KEY, userContent);

    // If logo caused an error, retry without it
    if (!response.ok && hasUsableLogo) {
      const errText = await response.text();
      console.warn(`Logo attachment rejected (${response.status}), retrying without logo:`, errText);
      response = await callImageModel(LOVABLE_API_KEY, [{ type: "text", text: buildPrompt(false) }]);
    }

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text();
      console.error(`AI Gateway error [${status}]:`, errText);
      if (status === 429) return jsonResponse({ success: false, error: "Rate limited.", errorCode: "rate_limit" }, 429);
      if (status === 402) return jsonResponse({ success: false, error: "AI credits exhausted.", errorCode: "credits" }, 402);
      return jsonResponse({ success: false, error: `AI generation failed (${status})`, errorCode: "ai_error" }, status >= 400 && status < 600 ? status : 500);
    }

    const aiData = await response.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response. Content:", JSON.stringify(aiData.choices?.[0]?.message?.content || '').substring(0, 500));
      return jsonResponse({ success: false, error: "AI did not return an image. Please try again.", errorCode: "no_image" }, 500);
    }

    // Upload base64 to Supabase Storage server-side for a permanent URL
    let publicUrl: string;
    try {
      publicUrl = await uploadBase64ToStorage(imageUrl);
      console.log("Mockup uploaded to storage:", publicUrl);
    } catch (storageErr: any) {
      console.error("Storage upload failed, returning base64 as fallback:", storageErr.message);
      // Return the base64 as fallback — client can still display it
      return jsonResponse({ success: true, mockupImage: imageUrl, storageFailed: true });
    }

    return jsonResponse({ success: true, mockupImage: publicUrl });
  } catch (error: any) {
    console.error("Unhandled error:", error.message, error.stack);
    return jsonResponse({ success: false, error: error.message || "Unknown error", errorCode: "unknown" }, 500);
  }
});
