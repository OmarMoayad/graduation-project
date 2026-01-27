import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Globe, HelpCircle, Package, CreditCard, Truck, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Language = 'ar' | 'en';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

// Visitor-focused responses - general information about the platform
const VISITOR_RESPONSES: Record<Language, Record<string, { keywords: string[]; response: string }>> = {
  ar: {
    about: {
      keywords: ['عن', 'ماهو', 'ما هو', 'النظام', 'ريمكس', 'remix', 'منصة', 'شرح'],
      response: `🏢 **مرحباً بك في Remix!**

Remix هو نظام متكامل لإدارة الأعمال يوفر:

✅ **إدارة المخزون** - تتبع المنتجات والمستودعات بدقة
✅ **نقاط البيع (POS)** - واجهة سهلة للمبيعات السريعة
✅ **المتجر الإلكتروني** - بيع منتجاتك أونلاين
✅ **إدارة العملاء** - قاعدة بيانات شاملة للعملاء
✅ **التقارير والتحليلات** - رؤى ذكية لتحسين أدائك
✅ **نظام التوصيل** - تتبع الشحنات والتوصيل

🚀 ابدأ تجربتك المجانية الآن!`
    },
    pricing: {
      keywords: ['سعر', 'اسعار', 'تكلفة', 'اشتراك', 'باقة', 'باقات', 'مجاني', 'دفع'],
      response: `💰 **خطط الأسعار**

🆓 **الباقة المجانية**
- تجربة مجانية لمدة 14 يوم
- جميع المميزات الأساسية
- دعم عبر البريد الإلكتروني

⭐ **الباقة الاحترافية**
- جميع المميزات المتقدمة
- دعم فني على مدار الساعة
- تقارير تحليلية متقدمة
- عدد غير محدود من المستخدمين

🏢 **باقة الشركات**
- حلول مخصصة للشركات الكبيرة
- تكامل مع أنظمة ERP
- مدير حساب مخصص

📞 تواصل معنا للحصول على عرض سعر مخصص!`
    },
    features: {
      keywords: ['مميزات', 'خصائص', 'ميزة', 'يقدم', 'يوفر', 'امكانيات'],
      response: `🌟 **مميزات Remix الرئيسية**

📦 **إدارة المخزون الذكية**
- تتبع المخزون في الوقت الفعلي
- تنبيهات إعادة الطلب التلقائية
- إدارة متعددة المستودعات

💳 **نقاط البيع المتطورة**
- واجهة سريعة وسهلة
- دعم الباركود والدفع المتعدد
- طباعة الفواتير الفورية

🛒 **متجر إلكتروني متكامل**
- تصميم جذاب ومتجاوب
- سلة مشتريات ذكية
- دعم عملات متعددة (شيقل، دولار، دينار)

📊 **تقارير وتحليلات**
- لوحة تحكم تفاعلية
- تقارير المبيعات والأرباح
- تحليل سلوك العملاء`
    },
    contact: {
      keywords: ['تواصل', 'اتصال', 'رقم', 'هاتف', 'ايميل', 'بريد', 'عنوان', 'موقع'],
      response: `📞 **تواصل معنا**

📧 **البريد الإلكتروني**
support@remix-system.com

📱 **واتساب / هاتف**
+970-599-123-456

🏢 **العنوان**
فلسطين - رام الله

⏰ **ساعات العمل**
الأحد - الخميس: 9 صباحاً - 6 مساءً

💬 **الدعم الفني**
متاح على مدار الساعة للمشتركين

🌐 نحن هنا لمساعدتك!`
    },
    demo: {
      keywords: ['تجربة', 'ديمو', 'demo', 'عرض', 'اختبار', 'تجريبي'],
      response: `🎯 **جرب Remix مجاناً!**

✨ **التجربة المجانية تشمل:**
- 14 يوم وصول كامل لجميع المميزات
- لا حاجة لبطاقة ائتمان
- دعم فني مجاني خلال التجربة
- بيانات تجريبية للتعلم

📌 **خطوات البدء:**
1. اضغط على "ابدأ الآن"
2. أنشئ حسابك في دقيقة
3. استكشف جميع المميزات
4. قرر الباقة المناسبة لك

🚀 ابدأ رحلتك الآن - مجاناً!`
    },
    support: {
      keywords: ['دعم', 'مساعدة', 'مشكلة', 'استفسار', 'سؤال'],
      response: `🛟 **مركز الدعم والمساعدة**

📚 **قاعدة المعرفة**
- أدلة استخدام تفصيلية
- فيديوهات تعليمية
- أسئلة شائعة

💬 **قنوات الدعم**
- دردشة مباشرة (للمشتركين)
- بريد إلكتروني: support@remix-system.com
- هاتف: +970-599-123-456

⏱️ **أوقات الاستجابة**
- المشتركين: خلال ساعة واحدة
- التجربة المجانية: خلال 24 ساعة

🎓 **تدريب مجاني**
نوفر جلسات تدريبية للفرق الجديدة`
    },
    shipping: {
      keywords: ['توصيل', 'شحن', 'تسليم', 'delivery', 'shipping'],
      response: `🚚 **خدمات التوصيل والشحن**

📦 **نظام التوصيل المتكامل**
- تتبع الشحنات في الوقت الفعلي
- إدارة شركات التوصيل المتعددة
- إشعارات تلقائية للعملاء

🏪 **خيارات التوصيل**
- توصيل سريع (نفس اليوم)
- توصيل عادي (2-3 أيام)
- استلام من الفرع

📍 **مناطق التغطية**
- جميع مناطق فلسطين
- إمكانية إضافة مناطق مخصصة

💡 تكامل تلقائي مع شركات التوصيل الرائدة!`
    },
    payment: {
      keywords: ['دفع', 'payment', 'فيزا', 'ماستركارد', 'كاش', 'تحويل'],
      response: `💳 **طرق الدفع المتاحة**

💵 **الدفع النقدي**
- عند الاستلام
- في الفرع

💳 **البطاقات الائتمانية**
- فيزا / ماستركارد
- دفع آمن ومشفر

🏦 **التحويل البنكي**
- حوالات بنكية
- تأكيد فوري

📱 **المحافظ الإلكترونية**
- Apple Pay
- Google Pay

🔒 جميع المعاملات محمية ومشفرة!`
    }
  },
  en: {
    about: {
      keywords: ['about', 'what is', 'remix', 'system', 'platform', 'explain'],
      response: `🏢 **Welcome to Remix!**

Remix is a comprehensive business management system offering:

✅ **Inventory Management** - Track products & warehouses accurately
✅ **Point of Sale (POS)** - Easy interface for quick sales
✅ **Online Store** - Sell your products online
✅ **Customer Management** - Comprehensive customer database
✅ **Reports & Analytics** - Smart insights to improve performance
✅ **Delivery System** - Track shipments & deliveries

🚀 Start your free trial now!`
    },
    pricing: {
      keywords: ['price', 'pricing', 'cost', 'subscription', 'plan', 'plans', 'free', 'payment'],
      response: `💰 **Pricing Plans**

🆓 **Free Plan**
- 14-day free trial
- All basic features
- Email support

⭐ **Professional Plan**
- All advanced features
- 24/7 technical support
- Advanced analytics
- Unlimited users

🏢 **Enterprise Plan**
- Custom solutions for large companies
- ERP integration
- Dedicated account manager

📞 Contact us for a custom quote!`
    },
    features: {
      keywords: ['features', 'capabilities', 'offers', 'provides'],
      response: `🌟 **Remix Key Features**

📦 **Smart Inventory Management**
- Real-time inventory tracking
- Automatic reorder alerts
- Multi-warehouse management

💳 **Advanced Point of Sale**
- Fast & easy interface
- Barcode & multi-payment support
- Instant invoice printing

🛒 **Integrated Online Store**
- Attractive responsive design
- Smart shopping cart
- Multi-currency support (ILS, USD, JOD)

📊 **Reports & Analytics**
- Interactive dashboard
- Sales & profit reports
- Customer behavior analysis`
    },
    contact: {
      keywords: ['contact', 'call', 'phone', 'email', 'address', 'location'],
      response: `📞 **Contact Us**

📧 **Email**
support@remix-system.com

📱 **WhatsApp / Phone**
+970-599-123-456

🏢 **Address**
Palestine - Ramallah

⏰ **Working Hours**
Sunday - Thursday: 9 AM - 6 PM

💬 **Technical Support**
24/7 for subscribers

🌐 We're here to help!`
    },
    demo: {
      keywords: ['trial', 'demo', 'test', 'try'],
      response: `🎯 **Try Remix for Free!**

✨ **Free Trial Includes:**
- 14 days full access to all features
- No credit card required
- Free support during trial
- Sample data for learning

📌 **Getting Started:**
1. Click "Get Started"
2. Create your account in a minute
3. Explore all features
4. Choose the right plan for you

🚀 Start your journey now - Free!`
    },
    support: {
      keywords: ['support', 'help', 'problem', 'question', 'issue'],
      response: `🛟 **Support & Help Center**

📚 **Knowledge Base**
- Detailed user guides
- Tutorial videos
- FAQs

💬 **Support Channels**
- Live chat (for subscribers)
- Email: support@remix-system.com
- Phone: +970-599-123-456

⏱️ **Response Times**
- Subscribers: Within 1 hour
- Free trial: Within 24 hours

🎓 **Free Training**
We provide training sessions for new teams`
    },
    shipping: {
      keywords: ['delivery', 'shipping', 'send'],
      response: `🚚 **Delivery & Shipping Services**

📦 **Integrated Delivery System**
- Real-time shipment tracking
- Multiple delivery company management
- Automatic customer notifications

🏪 **Delivery Options**
- Express delivery (same day)
- Standard delivery (2-3 days)
- Branch pickup

📍 **Coverage Areas**
- All Palestine regions
- Custom area addition available

💡 Automatic integration with leading delivery companies!`
    },
    payment: {
      keywords: ['pay', 'payment', 'visa', 'mastercard', 'cash', 'transfer'],
      response: `💳 **Available Payment Methods**

💵 **Cash Payment**
- Cash on delivery
- At branch

💳 **Credit Cards**
- Visa / Mastercard
- Secure encrypted payment

🏦 **Bank Transfer**
- Wire transfers
- Instant confirmation

📱 **Digital Wallets**
- Apple Pay
- Google Pay

🔒 All transactions are protected & encrypted!`
    }
  }
};

const QUICK_QUESTIONS: Record<Language, { icon: React.ReactNode; text: string; key: string }[]> = {
  ar: [
    { icon: <Package className="h-3 w-3" />, text: "ما هو Remix؟", key: "about" },
    { icon: <CreditCard className="h-3 w-3" />, text: "الأسعار والباقات", key: "pricing" },
    { icon: <HelpCircle className="h-3 w-3" />, text: "المميزات", key: "features" },
    { icon: <Phone className="h-3 w-3" />, text: "تواصل معنا", key: "contact" },
    { icon: <Truck className="h-3 w-3" />, text: "التوصيل", key: "shipping" },
  ],
  en: [
    { icon: <Package className="h-3 w-3" />, text: "What is Remix?", key: "about" },
    { icon: <CreditCard className="h-3 w-3" />, text: "Pricing & Plans", key: "pricing" },
    { icon: <HelpCircle className="h-3 w-3" />, text: "Features", key: "features" },
    { icon: <Phone className="h-3 w-3" />, text: "Contact Us", key: "contact" },
    { icon: <Truck className="h-3 w-3" />, text: "Delivery", key: "shipping" },
  ]
};

const INITIAL_MESSAGES: Record<Language, Message> = {
  ar: {
    id: "1",
    content: `👋 **أهلاً وسهلاً في Remix!**

أنا مساعدك الافتراضي، يسعدني مساعدتك في:
- التعرف على النظام ومميزاته
- معرفة الأسعار والباقات
- الإجابة على استفساراتك

💡 اختر سؤالاً سريعاً أو اكتب سؤالك!`,
    isBot: true,
    timestamp: new Date()
  },
  en: {
    id: "1",
    content: `👋 **Welcome to Remix!**

I'm your virtual assistant, happy to help you with:
- Learning about the system and features
- Pricing and plans information
- Answering your questions

💡 Choose a quick question or type your own!`,
    isBot: true,
    timestamp: new Date()
  }
};

const DEFAULT_RESPONSES: Record<Language, string> = {
  ar: `شكراً على سؤالك! 🙏

للأسف لم أفهم سؤالك بالضبط. يمكنك:
• اختيار أحد الأسئلة السريعة أدناه
• إعادة صياغة سؤالك
• التواصل مع فريق الدعم على: support@remix-system.com

نحن هنا لمساعدتك! 💪`,
  en: `Thank you for your question! 🙏

I didn't quite understand your question. You can:
• Choose one of the quick questions below
• Rephrase your question
• Contact our support team at: support@remix-system.com

We're here to help! 💪`
};

const detectLanguage = (text: string): Language => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text) ? 'ar' : 'en';
};

const VisitorChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGES.ar]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    setMessages([{ ...INITIAL_MESSAGES[newLang], id: Date.now().toString() }]);
  };

  const findResponse = (query: string, lang: Language): string => {
    const lowerQuery = query.toLowerCase();
    const responses = VISITOR_RESPONSES[lang];
    
    for (const [, data] of Object.entries(responses)) {
      if (data.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
        return data.response;
      }
    }
    
    return "";
  };

  const getAIResponse = async (message: string, lang: Language): Promise<string> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visitor-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message, language: lang }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("AI chat error:", data);
        if (data.fallback) {
          return data.fallback;
        }
        throw new Error(data.error || "AI service error");
      }

      return data.response;
    } catch (error) {
      console.error("Failed to get AI response:", error);
      throw error;
    }
  };

  const handleQuickQuestion = (key: string) => {
    const response = VISITOR_RESPONSES[language][key]?.response || DEFAULT_RESPONSES[language];
    const questionText = QUICK_QUESTIONS[language].find(q => q.key === key)?.text || "";
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: questionText,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input;
    const detectedLang = detectLanguage(userInput);
    if (detectedLang !== language) {
      setLanguage(detectedLang);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // First check if we have a predefined response
      const predefinedResponse = findResponse(userInput, detectedLang);
      
      let response: string;
      
      if (predefinedResponse && !useAI) {
        // Use predefined response
        response = predefinedResponse;
      } else if (useAI) {
        // Use AI for all questions when AI mode is enabled
        response = await getAIResponse(userInput, detectedLang);
      } else {
        // Fallback to default response
        response = DEFAULT_RESPONSES[detectedLang];
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(language === 'ar' ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred, please try again");
      
      // Fallback to default response on error
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: DEFAULT_RESPONSES[detectedLang],
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary via-primary to-accent text-white rounded-full shadow-2xl hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center hover:scale-110 group"
        aria-label="Open Chat"
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <>
            <MessageCircle className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-5 duration-300",
            language === 'ar' ? 'font-arabic' : ''
          )}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                  {useAI ? <Sparkles className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {language === 'ar' ? 'مساعد ذكي' : 'AI Assistant'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUseAI(!useAI)}
                  className={cn(
                    "text-white hover:bg-white/20 rounded-full",
                    useAI && "bg-white/20"
                  )}
                  title={language === 'ar' ? (useAI ? 'تعطيل الذكاء الاصطناعي' : 'تفعيل الذكاء الاصطناعي') : (useAI ? 'Disable AI' : 'Enable AI')}
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLanguage}
                  className="text-white hover:bg-white/20 rounded-full"
                  title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.isBot ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line",
                      message.isBot
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-gradient-to-r from-primary to-accent text-white rounded-tr-sm"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS[language].map((q) => (
                <button
                  key={q.key}
                  onClick={() => handleQuickQuestion(q.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-primary/10 border border-border rounded-full text-xs font-medium transition-colors hover:border-primary/50"
                >
                  {q.icon}
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...'}
                className="flex-1 rounded-full border-muted-foreground/20 focus-visible:ring-primary"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
              <Button 
                onClick={handleSend}
                size="icon"
                className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shrink-0"
                disabled={!input.trim()}
              >
                <Send className={cn("h-4 w-4", language === 'ar' ? 'rotate-180' : '')} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisitorChatBot;
