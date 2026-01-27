import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, HelpCircle, Globe } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

type Language = 'ar' | 'en';

const INITIAL_MESSAGES: Record<Language, Message> = {
  ar: {
    id: "1",
    text: "مرحباً! 👋 أنا مساعدك في نظام إدارة المخزون والمبيعات. اختر من الأسئلة الشائعة أدناه أو اكتب سؤالك:",
    isBot: true,
    timestamp: new Date(),
  },
  en: {
    id: "1",
    text: "Hello! 👋 I'm your assistant for the Inventory & Sales Management System. Choose from the quick questions below or type your question:",
    isBot: true,
    timestamp: new Date(),
  },
};

// Comprehensive FAQ responses for the system
const BOT_RESPONSES: Record<string, { keywords: string[]; response: Record<Language, string> }> = {
  inventory: {
    keywords: ["مخزون", "مستودع", "منتجات", "كمية", "مخزن", "inventory", "stock", "products", "warehouse", "quantity"],
    response: {
      ar: `📦 **إدارة المخزون:**

• أضف منتجات جديدة من قسم "المنتجات"
• تتبع الكميات في الوقت الفعلي
• أنشئ مستودعات متعددة
• تتبع أرقام الدفعات والتواريخ
• احصل على تنبيهات إعادة الطلب التلقائية

هل تريد مساعدة في شيء محدد؟`,
      en: `📦 **Inventory Management:**

• Add new products from "Products" section
• Track quantities in real-time
• Create multiple warehouses
• Track lot numbers and dates
• Get automatic reorder alerts

Need help with something specific?`
    }
  },
  addProduct: {
    keywords: ["أضيف منتج", "إضافة منتج", "منتج جديد", "add product", "new product", "create product"],
    response: {
      ar: `📝 **كيفية إضافة منتج:**

1. اذهب إلى **المخزون** > **المنتجات**
2. انقر على زر **"إضافة منتج"**
3. أدخل البيانات المطلوبة:
   • اسم المنتج
   • رمز SKU
   • السعر
   • الفئة
4. أضف صورة (اختياري)
5. انقر **"حفظ"**

💡 نصيحة: استخدم أرقام SKU فريدة لكل منتج!`,
      en: `📝 **How to Add a Product:**

1. Go to **Inventory** > **Products**
2. Click **"Add Product"** button
3. Enter required information:
   • Product name
   • SKU code
   • Price
   • Category
4. Add an image (optional)
5. Click **"Save"**

💡 Tip: Use unique SKU numbers for each product!`
    }
  },
  pos: {
    keywords: ["نقطة بيع", "كاشير", "pos", "بيع", "فاتورة", "جلسة", "point of sale", "cashier", "invoice", "session"],
    response: {
      ar: `💳 **نقطة البيع (POS):**

• افتح جلسة جديدة من "نقطة البيع"
• أضف المنتجات للسلة بالنقر أو البحث
• اختر طريقة الدفع (نقداً، بطاقة، تحويل)
• اطبع أو أرسل الفاتورة للعميل
• أغلق الجلسة في نهاية اليوم

الجلسة تتبع كل عمليات البيع والمدفوعات.`,
      en: `💳 **Point of Sale (POS):**

• Open a new session from "Point of Sale"
• Add products to cart by clicking or searching
• Choose payment method (cash, card, transfer)
• Print or send invoice to customer
• Close session at end of day

The session tracks all sales and payments.`
    }
  },
  orders: {
    keywords: ["طلب", "طلبات", "شراء", "توريد", "order", "purchase", "create order", "انشاء طلب", "أنشئ طلب"],
    response: {
      ar: `📋 **إدارة الطلبات:**

**إنشاء طلب بيع:**
1. اذهب إلى **المبيعات** > **طلبات البيع**
2. انقر **"طلب جديد"**
3. اختر العميل وأضف المنتجات
4. حدد طريقة الدفع والتوصيل
5. احفظ الطلب

**حالات الطلب:**
• مسودة → مؤكد → قيد التوصيل → مكتمل`,
      en: `📋 **Order Management:**

**Creating a Sales Order:**
1. Go to **Sales** > **Sales Orders**
2. Click **"New Order"**
3. Select customer and add products
4. Choose payment and delivery method
5. Save the order

**Order Statuses:**
• Draft → Confirmed → In Delivery → Completed`
    }
  },
  customers: {
    keywords: ["عميل", "عملاء", "مورد", "موردين", "جهة", "contact", "customer", "vendor", "supplier"],
    response: {
      ar: `👥 **إدارة جهات الاتصال:**

• أضف عملاء وموردين من قسم "جهات الاتصال"
• سجل معلومات التواصل والعناوين
• تتبع حدود الائتمان
• أضف حسابات بنكية للموردين
• استخدم التصنيفات لتنظيم جهات الاتصال`,
      en: `👥 **Contact Management:**

• Add customers and vendors from "Contacts" section
• Record contact information and addresses
• Track credit limits
• Add bank accounts for vendors
• Use tags to organize contacts`
    }
  },
  users: {
    keywords: ["مستخدم", "مستخدمين", "صلاحيات", "دور", "user", "permission", "role", "access", "أضيف مستخدم"],
    response: {
      ar: `🔐 **إدارة المستخدمين:**

**إضافة مستخدم جديد:**
1. اذهب إلى **الإعدادات** > **المستخدمين**
2. انقر **"إضافة مستخدم"**
3. أدخل البريد الإلكتروني وكلمة المرور
4. اختر الدور (مدير، مشرف، موظف، مشاهد)
5. احفظ

**الأدوار:**
• **مدير:** صلاحيات كاملة
• **مشرف:** إدارة بدون حذف
• **موظف:** إضافة وتعديل فقط
• **مشاهد:** قراءة فقط`,
      en: `🔐 **User Management:**

**Adding a New User:**
1. Go to **Settings** > **Users**
2. Click **"Add User"**
3. Enter email and password
4. Choose role (Admin, Manager, Staff, Viewer)
5. Save

**Roles:**
• **Admin:** Full access
• **Manager:** Management without delete
• **Staff:** Add and edit only
• **Viewer:** Read only`
    }
  },
  reports: {
    keywords: ["تقرير", "تقارير", "إحصائيات", "report", "analytics", "statistics", "dashboard"],
    response: {
      ar: `📊 **التقارير والإحصائيات:**

• تقارير المبيعات اليومية والشهرية
• تقارير المخزون والحركة
• خريطة حرارة المبيعات
• تحليل أداء المنتجات
• تقارير العملاء والموردين

استخدم الفلاتر لتخصيص التقارير حسب الفترة والمنتج.`,
      en: `📊 **Reports & Analytics:**

• Daily and monthly sales reports
• Inventory and movement reports
• Sales heatmap
• Product performance analysis
• Customer and vendor reports

Use filters to customize reports by period and product.`
    }
  },
  delivery: {
    keywords: ["توصيل", "شحن", "تتبع", "delivery", "shipping", "tracking", "شركة توصيل"],
    response: {
      ar: `🚚 **التوصيل والشحن:**

**إضافة شركة توصيل:**
1. اذهب إلى **الإعدادات** > **شركات التوصيل**
2. انقر **"إضافة شركة"**
3. أدخل بيانات الشركة

**ربط التوصيل بالطلب:**
• اختر شركة التوصيل عند إنشاء الطلب
• أضف رقم التتبع
• تابع حالة الشحنة`,
      en: `🚚 **Delivery & Shipping:**

**Adding a Delivery Company:**
1. Go to **Settings** > **Delivery Companies**
2. Click **"Add Company"**
3. Enter company details

**Linking Delivery to Order:**
• Select delivery company when creating order
• Add tracking number
• Monitor shipment status`
    }
  },
  shop: {
    keywords: ["متجر", "تسوق", "شراء", "سلة", "shop", "cart", "checkout", "online store"],
    response: {
      ar: `🛒 **المتجر الإلكتروني:**

• تصفح المنتجات من صفحة **"المتجر"**
• أضف المنتجات للسلة
• أكمل الطلب مع بيانات التوصيل
• اختر طريقة الدفع
• تتبع طلبك من **"حسابي"**

💡 يمكنك تغيير العملة (شيقل، دولار، دينار) من الرأس!`,
      en: `🛒 **Online Shop:**

• Browse products from **"Shop"** page
• Add products to cart
• Complete order with delivery details
• Choose payment method
• Track your order from **"My Account"**

💡 You can change currency (ILS, USD, JOD) from the header!`
    }
  },
  payment: {
    keywords: ["دفع", "تحويل", "بنك", "payment", "bank", "transfer", "طرق الدفع"],
    response: {
      ar: `💰 **طرق الدفع:**

• **نقداً:** الدفع عند الاستلام
• **تحويل بنكي:** أدخل رقم الحوالة
• **بطاقة:** في نقطة البيع

**للتحويل البنكي:**
1. اختر "تحويل بنكي" عند الدفع
2. أدخل معلومات البنك ورقم المرجع
3. سيتم مراجعة طلبك والموافقة عليه`,
      en: `💰 **Payment Methods:**

• **Cash:** Payment on delivery
• **Bank Transfer:** Enter transfer reference
• **Card:** At point of sale

**For Bank Transfer:**
1. Select "Bank Transfer" at checkout
2. Enter bank info and reference number
3. Your order will be reviewed and approved`
    }
  },
  settings: {
    keywords: ["إعداد", "إعدادات", "ضبط", "setting", "configure", "configuration"],
    response: {
      ar: `⚙️ **الإعدادات:**

• **المستخدمين:** إدارة حسابات المستخدمين والأدوار
• **مجموعات الوصول:** تحديد الصلاحيات لكل مجموعة
• **شركات التوصيل:** إضافة وإدارة شركات الشحن
• **الإعلانات:** إدارة إعلانات الصفحة الرئيسية

⚠️ الوصول للإعدادات يتطلب صلاحيات مدير.`,
      en: `⚙️ **Settings:**

• **Users:** Manage user accounts and roles
• **Access Groups:** Define permissions per group
• **Delivery Companies:** Add and manage shipping companies
• **Advertisements:** Manage homepage ads

⚠️ Settings access requires admin permissions.`
    }
  },
  login: {
    keywords: ["تسجيل", "دخول", "login", "sign in", "sign up", "حساب", "account"],
    response: {
      ar: `🔑 **تسجيل الدخول:**

1. اذهب إلى صفحة **"تسجيل الدخول"**
2. أدخل البريد الإلكتروني وكلمة المرور
3. انقر **"دخول"**

**نسيت كلمة المرور؟**
تواصل مع مدير النظام لإعادة تعيينها.

**مستخدم جديد؟**
يجب أن يقوم المدير بإنشاء حسابك.`,
      en: `🔑 **Login:**

1. Go to **"Sign In"** page
2. Enter email and password
3. Click **"Sign In"**

**Forgot password?**
Contact your system administrator to reset it.

**New user?**
Admin must create your account.`
    }
  },
  currency: {
    keywords: ["عملة", "شيقل", "دولار", "دينار", "currency", "shekel", "dollar", "dinar", "ils", "usd", "jod"],
    response: {
      ar: `💱 **العملات:**

**العملات المتاحة:**
• 🇮🇱 شيقل إسرائيلي (₪)
• 🇺🇸 دولار أمريكي ($)
• 🇯🇴 دينار أردني (د.أ)

**لتغيير العملة:**
1. انقر على زر العملة في رأس الصفحة
2. اختر العملة المطلوبة
3. سيتم تحويل الأسعار تلقائياً`,
      en: `💱 **Currencies:**

**Available Currencies:**
• 🇮🇱 Israeli Shekel (₪)
• 🇺🇸 US Dollar ($)
• 🇯🇴 Jordanian Dinar (JOD)

**To Change Currency:**
1. Click currency button in header
2. Select desired currency
3. Prices will convert automatically`
    }
  },
  categories: {
    keywords: ["فئة", "فئات", "تصنيف", "category", "categories", "classification"],
    response: {
      ar: `🏷️ **إدارة الفئات:**

1. اذهب إلى **المخزون** > **الفئات**
2. انقر **"إضافة فئة"**
3. أدخل اسم الفئة
4. اختر فئة أب (اختياري) للتصنيف الهرمي
5. احفظ

💡 استخدم الفئات لتنظيم منتجاتك بشكل أفضل!`,
      en: `🏷️ **Category Management:**

1. Go to **Inventory** > **Categories**
2. Click **"Add Category"**
3. Enter category name
4. Select parent category (optional) for hierarchy
5. Save

💡 Use categories to better organize your products!`
    }
  },
  help: {
    keywords: ["مساعدة", "help", "support", "دعم", "how", "كيف"],
    response: {
      ar: `❓ **كيف يمكنني مساعدتك؟**

أستطيع الإجابة عن أسئلة حول:

📦 إدارة المخزون والمنتجات
💳 نقطة البيع والفواتير
📋 إدارة الطلبات
👥 العملاء والموردين
🔐 المستخدمين والصلاحيات
📊 التقارير والإحصائيات
🚚 التوصيل والشحن
🛒 المتجر الإلكتروني
💰 طرق الدفع
⚙️ الإعدادات

اكتب سؤالك أو اختر من الأسئلة السريعة أدناه!`,
      en: `❓ **How can I help you?**

I can answer questions about:

📦 Inventory & Products
💳 Point of Sale & Invoices
📋 Order Management
👥 Customers & Vendors
🔐 Users & Permissions
📊 Reports & Analytics
🚚 Delivery & Shipping
🛒 Online Shop
💰 Payment Methods
⚙️ Settings

Type your question or choose from quick questions below!`
    }
  },
};

const QUICK_QUESTIONS: Record<Language, { text: string; category: string }[]> = {
  ar: [
    { text: "كيف أضيف منتج؟", category: "addProduct" },
    { text: "كيف أنشئ طلب؟", category: "orders" },
    { text: "كيف أضيف مستخدم؟", category: "users" },
    { text: "طرق الدفع؟", category: "payment" },
    { text: "التوصيل والشحن", category: "delivery" },
    { text: "نقطة البيع", category: "pos" },
  ],
  en: [
    { text: "How to add product?", category: "addProduct" },
    { text: "How to create order?", category: "orders" },
    { text: "How to add user?", category: "users" },
    { text: "Payment methods?", category: "payment" },
    { text: "Delivery & Shipping", category: "delivery" },
    { text: "Point of Sale", category: "pos" },
  ],
};

const DEFAULT_RESPONSES: Record<Language, string> = {
  ar: `شكراً على تواصلك! 🙏

يمكنني مساعدتك في:
• إدارة المخزون والمنتجات
• نقطة البيع والفواتير
• إدارة الطلبات والعملاء
• التقارير والإحصائيات
• إعدادات النظام

اختر من الأسئلة السريعة أدناه أو اكتب سؤالك بالتفصيل.`,
  en: `Thank you for reaching out! 🙏

I can help you with:
• Inventory & Product Management
• Point of Sale & Invoices
• Order & Customer Management
• Reports & Analytics
• System Settings

Choose from the quick questions below or type your question in detail.`
};

// Detect language from text
const detectLanguage = (text: string): Language => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text) ? 'ar' : 'en';
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGES.ar]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const detectedLang = detectLanguage(userMessage);
    
    // Use detected language for response, but prefer current UI language
    const responseLang = detectedLang;
    
    // Check each category for keyword matches
    for (const [, data] of Object.entries(BOT_RESPONSES)) {
      for (const keyword of data.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          return data.response[responseLang];
        }
      }
    }

    // Default response based on detected language
    return DEFAULT_RESPONSES[responseLang];
  };

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(messageText),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
        aria-label="Open Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="fixed bottom-24 left-6 z-50 w-[400px] max-w-[calc(100vw-48px)] shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              {language === 'ar' ? 'مساعد النظام' : 'System Assistant'}
              <div className="flex items-center gap-1 ms-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-white hover:bg-white/20"
                  onClick={toggleLanguage}
                >
                  <Globe className="h-4 w-4 me-1" />
                  {language === 'ar' ? 'EN' : 'عربي'}
                </Button>
                <HelpCircle className="h-4 w-4 opacity-70" />
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.isBot ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isBot
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {message.isBot ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                        message.isBot
                          ? "bg-muted text-foreground rounded-ts-none"
                          : "bg-primary text-primary-foreground rounded-te-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted px-4 py-3 rounded-2xl rounded-ts-none">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            <div className="px-3 py-2 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'ar' ? 'أسئلة سريعة:' : 'Quick questions:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS[language].map((q, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleQuickQuestion(q.text)}
                  >
                    {q.text}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t p-3">
            <div className="flex gap-2 w-full">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'ar' ? "اكتب سؤالك..." : "Type your question..."}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default ChatBot;
