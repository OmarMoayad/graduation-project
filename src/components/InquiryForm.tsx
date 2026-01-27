import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle, Loader2, Send, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(100),
  email: z.string().trim().email("البريد الإلكتروني غير صالح"),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(3, "الموضوع مطلوب").max(200),
  message: z.string().trim().min(10, "الرسالة قصيرة جداً").max(2000),
});

const InquiryForm = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = inquirySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-inquiry", {
        body: {
          ...formData,
          language: i18n.language,
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success(
        isRTL
          ? "تم إرسال استفسارك بنجاح!"
          : "Your inquiry has been sent successfully!"
      );
    } catch (error: any) {
      console.error("Error sending inquiry:", error);
      toast.error(
        isRTL
          ? "فشل إرسال الاستفسار. يرجى المحاولة مرة أخرى."
          : "Failed to send inquiry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setSubmitted(false);
    setErrors({});
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(resetForm, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-24 end-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 p-0"
          title={isRTL ? "استفسارات" : "Inquiries"}
        >
          <HelpCircle className="h-6 w-6 text-white" />
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isRTL ? "تم إرسال استفسارك!" : "Inquiry Sent!"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isRTL
                ? "شكراً لتواصلك معنا. سيقوم فريق الاستعلامات بالرد عليك قريباً عبر البريد الإلكتروني."
                : "Thank you for contacting us. Our inquiries team will get back to you soon via email."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {isRTL ? "إغلاق" : "Close"}
              </Button>
              <Button onClick={resetForm}>
                {isRTL ? "إرسال استفسار آخر" : "Send Another"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-amber-500" />
                {isRTL ? "نموذج الاستفسارات" : "Inquiry Form"}
              </DialogTitle>
              <DialogDescription>
                {isRTL
                  ? "أرسل استفسارك وسيتم الرد عليك من قبل فريق الاستعلامات عبر البريد الإلكتروني."
                  : "Send your inquiry and our team will respond via email."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {isRTL ? "الاسم الكامل" : "Full Name"} *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={isRTL ? "أحمد محمد" : "John Doe"}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {isRTL ? "رقم الهاتف" : "Phone"} ({isRTL ? "اختياري" : "optional"})
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+970 59 123 4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {isRTL ? "البريد الإلكتروني" : "Email"} *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">
                  {isRTL ? "موضوع الاستفسار" : "Subject"} *
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={
                    isRTL ? "استفسار عن المنتجات" : "Product inquiry"
                  }
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  {isRTL ? "الرسالة" : "Message"} *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={
                    isRTL
                      ? "اكتب استفسارك هنا بالتفصيل..."
                      : "Write your inquiry in detail..."
                  }
                  rows={5}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    {isRTL ? "جاري الإرسال..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 me-2" />
                    {isRTL ? "إرسال الاستفسار" : "Send Inquiry"}
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InquiryForm;
