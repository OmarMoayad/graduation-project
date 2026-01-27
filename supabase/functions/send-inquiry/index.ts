import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Remix System <onboarding@resend.dev>";
const INQUIRIES_TO_EMAIL = Deno.env.get("INQUIRIES_TO_EMAIL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InquiryRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  language: "ar" | "en";
}

async function sendResendEmail(payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  return { ok: res.ok, status: res.status, bodyText: text };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received inquiry request");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message, language }: InquiryRequest =
      await req.json();

    console.log("Inquiry from:", name, email);

    // Validate required fields
    if (!name || !email || !subject || !message) {
      const errorMessage =
        language === "ar"
          ? "جميع الحقول المطلوبة يجب أن تكون مملوءة"
          : "All required fields must be filled";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errorMessage =
        language === "ar" ? "البريد الإلكتروني غير صالح" : "Invalid email address";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Store inquiry in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: dbError } = await supabase.from("inquiries").insert({
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: "pending",
    });
    if (dbError) {
      console.error("Failed to store inquiry:", dbError);
    } else {
      console.log("Inquiry stored successfully");
    }

    // If email isn't configured, don't fail the UI.
    if (!RESEND_API_KEY) {
      const msg =
        language === "ar"
          ? "تم استلام استفسارك بنجاح، لكن خدمة البريد غير مفعلة حالياً."
          : "Your inquiry was received, but email is not configured yet.";
      return new Response(JSON.stringify({ success: true, message: msg }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // IMPORTANT: Resend in test mode only allows sending to the account email.
    // So we default the notification recipient to the sender's email unless INQUIRIES_TO_EMAIL is configured.
    const toNotification = INQUIRIES_TO_EMAIL ?? email;

    const notificationEmailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">استفسار جديد من الموقع</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>البريد الإلكتروني:</strong> ${email}</p>
          ${phone ? `<p><strong>رقم الهاتف:</strong> ${phone}</p>` : ""}
          <p><strong>الموضوع:</strong> ${subject}</p>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">الرسالة:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          تم إرسال هذا الاستفسار عبر نموذج التواصل في الموقع
        </p>
      </div>
    `;

    const confirmationContent = language === "ar"
      ? {
          subject: "تم استلام استفسارك بنجاح",
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7c3aed;">شكراً لتواصلك معنا، ${name}!</h2>
              <p>لقد استلمنا استفسارك وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">تفاصيل استفسارك:</h3>
                <p><strong>الموضوع:</strong> ${subject}</p>
                <p><strong>الرسالة:</strong></p>
                <p style="white-space: pre-wrap; color: #6b7280;">${message}</p>
              </div>
              <p>مع أطيب التحيات،<br>فريق Remix</p>
            </div>
          `,
        }
      : {
          subject: "We received your inquiry",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7c3aed;">Thank you for contacting us, ${name}!</h2>
              <p>We have received your inquiry and our team will get back to you as soon as possible.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your inquiry details:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap; color: #6b7280;">${message}</p>
              </div>
              <p>Best regards,<br>The Remix Team</p>
            </div>
          `,
        };

    // Send notification (do not throw)
    let notificationSent = false;
    try {
      const r = await sendResendEmail({
        from: RESEND_FROM,
        to: [toNotification],
        reply_to: email,
        subject: `[استفسار جديد] ${subject}`,
        html: notificationEmailHtml,
      });
      notificationSent = r.ok;
      if (!r.ok) console.error("Notification email failed:", r.status, r.bodyText);
    } catch (e) {
      console.error("Notification email failed:", e);
    }

    // Send confirmation (do not throw)
    let confirmationSent = false;
    try {
      const r = await sendResendEmail({
        from: RESEND_FROM,
        to: [email],
        subject: confirmationContent.subject,
        html: confirmationContent.html,
      });
      confirmationSent = r.ok;
      if (!r.ok) console.error("Confirmation email failed:", r.status, r.bodyText);
    } catch (e) {
      console.error("Confirmation email failed:", e);
    }

    const anyEmailFailed = !(notificationSent && confirmationSent);
    const successMessage = language === "ar"
      ? (anyEmailFailed
          ? "تم استلام استفسارك بنجاح (لكن إعدادات البريد تحتاج ضبط)."
          : "تم إرسال استفسارك بنجاح! سنتواصل معك قريباً.")
      : (anyEmailFailed
          ? "Inquiry received (email delivery needs configuration)."
          : "Your inquiry has been sent successfully! We'll get back to you soon.");

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        email_status: {
          notification_sent: notificationSent,
          confirmation_sent: confirmationSent,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-inquiry function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
