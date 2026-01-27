import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Sparkles, BarChart, TrendingUp, Paperclip, X, FileText } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UploadedFile {
  name: string;
  content: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "أهلاً وسهلاً! 👋\n\nأنا صديقك الذكي لمساعدتك في فهم بيانات عملك. اسألني بأي طريقة تحب - بالعربي الفصيح أو العامي، أنا فاهم عليك! 😊\n\n💡 جرب تقول:\n• \"شو أكثر شي يبيع عندي؟\"\n• \"بدي أعرف كم منتج عندي\"\n• \"فيه شي سعره غالي؟\""
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const suggestedQuestions = [
    "شو أكثر شي ماشي بالمبيعات؟ 🔥",
    "عطيني فكرة عن المخزون 📦",
    "وين أكثر منتجات عندي؟ 🏭",
    "كم عميل وكم مورد عندي؟ 👥",
    "فيه شي قرب يخلص؟ ⚠️",
    "شو أغلى منتج عندي؟ 💰"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/csv', 'application/json', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error("يرجى رفع ملف CSV أو JSON فقط");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedFile({ name: file.name, content });
      toast.success(`تم رفع الملف: ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("فشل في قراءة الملف");
    };
    reader.readAsText(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (question?: string) => {
    const queryText = question || input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            query: queryText,
            fileContent: uploadedFile?.content || null
          }),
        }
      );

      if (response.status === 429) {
        toast.error("تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.");
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "عذراً، هناك طلبات كثيرة حالياً. يرجى المحاولة بعد قليل."
        }]);
        return;
      }

      if (response.status === 402) {
        toast.error("نفدت أرصدة الذكاء الاصطناعي.");
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "نفدت أرصدة الذكاء الاصطناعي. يرجى التواصل مع المسؤول لإضافة رصيد."
        }]);
        return;
      }

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const j = await response.json();
          if (j?.error) errMsg = j.error;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Clear file after successful query
      if (uploadedFile) {
        removeFile();
      }

    } catch (error) {
      console.error("Error querying AI:", error);
      toast.error(error instanceof Error ? error.message : "فشل في الحصول على الإجابة");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">تقارير الذكاء الاصطناعي</h1>
          </div>
          <p className="text-muted-foreground">
            اسأل أسئلة عن بياناتك واحصل على تحليلات فورية
          </p>
        </div>

        {/* Quick Access */}
        {messages.length <= 1 && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-3 text-muted-foreground">وصول سريع:</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/reports/heatmap")}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">خريطة المبيعات</h3>
                    <p className="text-xs text-muted-foreground">تصور مواقع المنتجات</p>
                  </div>
                </div>
              </Card>
            </div>
            <p className="text-sm font-medium mb-3 text-muted-foreground">أو اسأل سؤالاً:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(question)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-muted-foreground">لحظة، عم بحلل البيانات... 🔍</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Uploaded File Preview */}
        {uploadedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm flex-1 truncate">{uploadedFile.name}</span>
            <Button variant="ghost" size="sm" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.json,.txt"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="رفع ملف"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اسأل بأي طريقة تحب... مثلاً: شو أكثر شي يبيع؟ 🎯"
            disabled={isLoading}
            className="flex-1 text-base"
            dir="auto"
          />
          <Button
            onClick={() => handleSubmit()}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
