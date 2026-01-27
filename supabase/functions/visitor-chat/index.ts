import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = {
  ar: `أنت مساعد ذكي ودود لنظام Remix - نظام متكامل لإدارة الأعمال.

معلومات عن Remix:
- نظام إدارة أعمال متكامل يشمل: إدارة المخزون، نقاط البيع (POS)، المتجر الإلكتروني، إدارة العملاء، التقارير، ونظام التوصيل
- يوفر تجربة مجانية لمدة 14 يوم
- يدعم عملات متعددة: شيقل، دولار، دينار
- البريد الإلكتروني: support@remix-system.com
- الهاتف: +970-599-123-456
- الموقع: فلسطين - رام الله
- ساعات العمل: الأحد - الخميس: 9 صباحاً - 6 مساءً

المميزات الرئيسية:
- إدارة المخزون في الوقت الفعلي مع تنبيهات إعادة الطلب
- نقاط بيع سريعة مع دعم الباركود
- متجر إلكتروني متجاوب مع سلة ذكية
- تقارير وتحليلات تفاعلية
- نظام توصيل متكامل مع تتبع الشحنات

الباقات:
- باقة مجانية: 14 يوم تجربة كاملة
- باقة احترافية: جميع المميزات + دعم 24/7
- باقة شركات: حلول مخصصة

أجب بشكل ودود ومختصر. استخدم الإيموجي بشكل معتدل. أجب بالعربية دائماً.`,

  en: `You are a friendly AI assistant for Remix - a comprehensive business management system.

About Remix:
- Complete business management system including: Inventory Management, POS, Online Store, Customer Management, Reports, and Delivery System
- 14-day free trial available
- Multi-currency support: ILS, USD, JOD
- Email: support@remix-system.com
- Phone: +970-599-123-456
- Location: Palestine - Ramallah
- Working Hours: Sunday - Thursday: 9 AM - 6 PM

Key Features:
- Real-time inventory management with reorder alerts
- Fast POS with barcode support
- Responsive online store with smart cart
- Interactive reports and analytics
- Integrated delivery system with shipment tracking

Plans:
- Free Plan: 14-day full trial
- Professional: All features + 24/7 support
- Enterprise: Custom solutions

Answer friendly and concise. Use emojis moderately. Always respond in English.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: "AI service not configured",
          fallback: language === 'ar' 
            ? "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى التواصل معنا على support@remix-system.com"
            : "Sorry, AI service is currently unavailable. Please contact us at support@remix-system.com"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = SYSTEM_PROMPT[language as keyof typeof SYSTEM_PROMPT] || SYSTEM_PROMPT.en;

    console.log("Calling Lovable AI for visitor chat...");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            fallback: language === 'ar'
              ? "عذراً، النظام مشغول حالياً. يرجى المحاولة بعد قليل."
              : "Sorry, the system is busy. Please try again shortly."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required",
            fallback: language === 'ar'
              ? "عذراً، خدمة الذكاء الاصطناعي غير متاحة. تواصل معنا على support@remix-system.com"
              : "Sorry, AI service unavailable. Contact us at support@remix-system.com"
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: "AI service error",
          fallback: language === 'ar'
            ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى."
            : "Sorry, an error occurred. Please try again."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiResponse.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      console.error("No content in AI response:", data);
      return new Response(
        JSON.stringify({ 
          error: "Empty AI response",
          fallback: language === 'ar'
            ? "عذراً، لم أتمكن من فهم سؤالك. يرجى إعادة الصياغة."
            : "Sorry, I couldn't understand your question. Please rephrase."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ response: responseContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Visitor chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: "Sorry, an error occurred. Please try again later."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
