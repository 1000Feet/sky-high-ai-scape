import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ClientSignupEmailRequest {
  name: string;
  email: string;
  phone?: string;
  businessType?: string;
  website?: string;
  socialMedia?: string;
  desiredServices: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Client signup email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientData: ClientSignupEmailRequest = await req.json();
    console.log("Client signup data received:", { ...clientData, email: "[REDACTED]" });

    // Send confirmation email to client
    const clientEmailResponse = await resend.emails.send({
      from: "1000 Feet Above <info@1000feetabove.com>",
      to: [clientData.email],
      subject: "Thank you for your interest - We'll be in touch soon!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1e293b, #1e40af, #1e293b); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Thank You for Your Interest!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${clientData.name}</strong>,
            </p>
            
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for reaching out to us! We've received your inquiry about our <strong>${clientData.desiredServices}</strong> services.
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">What happens next?</h3>
              <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Our team will review your requirements within 24 hours</li>
                <li>We'll prepare a customized proposal for your project</li>
                <li>You'll receive a follow-up call or email to discuss details</li>
                <li>We'll schedule a consultation to plan your digital solution</li>
              </ul>
            </div>
            
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              In the meantime, feel free to check out our portfolio and learn more about how we help businesses like yours succeed online.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:hello@digitalsolutions.com" style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Contact Us Directly
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              Best regards,<br>
              <strong>The Digital Solutions Team</strong><br>
              Transforming businesses through innovative digital solutions
            </p>
          </div>
        </div>
      `,
    });

    console.log("Client confirmation email sent:", clientEmailResponse);

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "1000 Feet Above <info@1000feetabove.com>",
      to: ["info@1000feetabove.com"],
      subject: `New Client Signup: ${clientData.name} - ${clientData.desiredServices}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 New Client Signup!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">Client Details:</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientData.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientData.email}</td>
                </tr>
                ${clientData.phone ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientData.phone}</td>
                </tr>
                ` : ''}
                ${clientData.businessType ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Business:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientData.businessType}</td>
                </tr>
                ` : ''}
                ${clientData.website ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Website:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientData.website}</td>
                </tr>
                ` : ''}
                ${clientData.socialMedia ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Social Media:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${clientData.socialMedia}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Services:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${clientData.desiredServices}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Action Required:</h3>
              <p style="color: #d97706; margin: 0; font-size: 14px;">
                Please follow up with this client within 24 hours to maintain our service standards.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${clientData.email}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Reply to Client
              </a>
              ${clientData.phone ? `
              <a href="tel:${clientData.phone}" style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Call Client
              </a>
              ` : ''}
            </div>
          </div>
        </div>
      `,
    });

    console.log("Admin notification email sent:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        clientEmailId: clientEmailResponse.data?.id,
        adminEmailId: adminEmailResponse.data?.id
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-signup-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);