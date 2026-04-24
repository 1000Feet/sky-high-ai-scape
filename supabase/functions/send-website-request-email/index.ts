import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();

    // Send notification to admin
    const adminEmail = await resend.emails.send({
      from: "1000 Feet Above <info@1000feetabove.com>",
      to: ["info@1000feetabove.com"],
      subject: `🎨 New Website Request: ${data.businessName} - ${data.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎨 New Website Request!</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">Client Details:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Name:</td><td style="padding: 8px 0; color: #1f2937;">${data.name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td><td style="padding: 8px 0; color: #1f2937;">${data.email}</td></tr>
              ${data.phone ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td><td style="padding: 8px 0; color: #1f2937;">${data.phone}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Business:</td><td style="padding: 8px 0; color: #1f2937;">${data.businessName}</td></tr>
              ${data.businessType ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td><td style="padding: 8px 0; color: #1f2937;">${data.businessType}</td></tr>` : ''}
              ${data.socialMedia ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Social Media:</td><td style="padding: 8px 0; color: #1f2937;">${data.socialMedia}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Colors:</td><td style="padding: 8px 0; color: #1f2937;">${data.colorPalette}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Has Logo:</td><td style="padding: 8px 0; color: #1f2937;">${data.logoUrl ? 'Yes' : 'No'}</td></tr>
            </table>
            ${data.logoUrl ? `<div style="margin-top: 20px;"><strong>Logo:</strong><br><img src="${data.logoUrl}" style="max-width: 200px; margin-top: 10px; border-radius: 8px;" /></div>` : ''}
            ${data.mockupUrl ? `<div style="margin-top: 20px;"><strong>Approved Mockup:</strong><br><img src="${data.mockupUrl}" style="max-width: 100%; margin-top: 10px; border-radius: 8px;" /></div>` : ''}
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-weight: bold;">The client approved the mockup! Follow up to finalize the project.</p>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="mailto:${data.email}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reply to Client</a>
            </div>
          </div>
        </div>
      `,
    });

    // Send confirmation to client
    const clientEmail = await resend.emails.send({
      from: "1000 Feet Above <info@1000feetabove.com>",
      to: [data.email],
      subject: "Your Website Request Has Been Received! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">We're On It! 🚀</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 12px;">
            <p style="color: #334155; font-size: 16px;">Hi <strong>${data.name}</strong>,</p>
            <p style="color: #334155; font-size: 16px;">Thank you for choosing 1000 Feet Above for your website! We've received your request for <strong>${data.businessName}</strong> and our team will be in touch very soon to discuss the next steps.</p>
            <p style="color: #334155; font-size: 16px;">We'll work together to bring your vision to life!</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">Best regards,<br><strong>The 1000 Feet Above Team</strong></p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
