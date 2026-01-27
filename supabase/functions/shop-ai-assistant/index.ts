import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, targetLang } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "translate") {
      systemPrompt = `You are a professional translator. Translate the given text accurately while maintaining the original meaning and tone. Only respond with the translated text, nothing else.`;
      
      if (targetLang === "ar") {
        userPrompt = `Translate the following English text to Arabic:\n\n${text}`;
      } else {
        userPrompt = `Translate the following Arabic text to English:\n\n${text}`;
      }
    } else if (action === "suggest") {
      const randomSeed = Math.random().toString(36).substring(7);
      const styles = [
        "elegant and luxurious",
        "friendly and warm",
        "modern and trendy",
        "professional and trustworthy",
        "exciting and energetic",
        "cozy and welcoming",
        "exclusive and premium",
        "fun and playful"
      ];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      
      systemPrompt = `You are a creative marketing copywriter. Generate unique, engaging welcome messages for e-commerce stores. Be creative and avoid generic phrases like "Welcome to our store" or "مرحباً بكم في متجرنا". Each message should feel fresh and different. Only respond with the suggested text, nothing else.`;
      
      if (targetLang === "ar") {
        userPrompt = `Generate a creative and unique Arabic welcome message for an online store. Style: ${randomStyle}. Be original and avoid clichés. Use creative Arabic expressions. Keep it concise (1-2 sentences). Random seed for variety: ${randomSeed}. Respond only in Arabic.`;
      } else {
        userPrompt = `Generate a creative and unique English welcome message for an online store. Style: ${randomStyle}. Be original and avoid clichés. Keep it concise (1-2 sentences). Random seed for variety: ${randomSeed}. Respond only in English.`;
      }
    } else {
      throw new Error("Invalid action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار في استخدام الذكاء الاصطناعي" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ result: result.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("shop-ai-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
