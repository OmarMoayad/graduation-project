import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, CreditCard, Building2 } from "lucide-react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getShopOrganization } from "@/lib/shop-config";

const checkoutSchema = z.object({
  firstName: z.string().trim().min(2, "الاسم الأول مطلوب").max(100),
  lastName: z.string().trim().min(2, "اسم العائلة مطلوب").max(100),
  fatherName: z.string().trim().optional(),
  grandfatherName: z.string().trim().optional(),
  email: z.string().trim().email("البريد الإلكتروني غير صالح"),
  phone: z.string().trim().min(8, "رقم الهاتف مطلوب"),
  country: z.string().trim().min(2, "الدولة مطلوبة"),
  city: z.string().trim().min(2, "المدينة مطلوبة"),
  street: z.string().trim().min(5, "العنوان مطلوب"),
  building: z.string().trim().optional(),
  floor: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  bankName: z.string().trim().min(2, "اسم البنك مطلوب"),
  bankAccountHolder: z.string().trim().min(2, "اسم صاحب الحساب مطلوب"),
  bankAccountNumber: z.string().trim().min(5, "رقم الحساب مطلوب"),
  bankTransferReference: z.string().trim().optional(),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    grandfatherName: "",
    email: "",
    phone: "",
    country: "الأراضي الفلسطينية",
    city: "",
    street: "",
    building: "",
    floor: "",
    postalCode: "",
    notes: "",
    bankName: "",
    bankAccountHolder: "",
    bankAccountNumber: "",
    bankTransferReference: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: portalUser } = await supabase
          .from("portal_users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (portalUser) {
          setFormData((prev) => ({
            ...prev,
            email: portalUser.email || user.email || "",
            phone: portalUser.phone || "",
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            email: user.email || "",
          }));
        }
      }
    };

    checkUser();
  }, []);

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

    const result = checkoutSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (cart.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const shopOrg = await getShopOrganization();

      if (!shopOrg) {
        throw new Error("تعذر معالجة الطلب. المتجر غير مهيأ بشكل صحيح.");
      }

      const orderNum = `SO-${Date.now().toString(36).toUpperCase()}`;
      const fullName = `${formData.firstName} ${formData.fatherName || ""} ${formData.grandfatherName || ""} ${formData.lastName}`.trim();
      const shippingAddress = `${formData.street}, ${formData.building || ""} ${formData.floor ? "طابق " + formData.floor : ""}, ${formData.city}, ${formData.country} ${formData.postalCode || ""}`.trim();

      // For guest checkout, avoid returning/reading the inserted row (RLS might block SELECT).
      // Instead, generate the UUID on the client and insert without `.select()`.
      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          id: orderId,
          organization_id: shopOrg.id,
          order_number: orderNum,
          portal_user_id: user?.id || null,
          guest_name: fullName,
          guest_email: formData.email,
          guest_phone: formData.phone,
          shipping_address: shippingAddress,
          notes: formData.notes || null,
          status: "draft",
          subtotal: totalPrice,
          total_amount: totalPrice,
          first_name: formData.firstName,
          last_name: formData.lastName,
          father_name: formData.fatherName || null,
          grandfather_name: formData.grandfatherName || null,
          city: formData.city,
          country: formData.country,
          street: formData.street,
          building: formData.building || null,
          floor: formData.floor || null,
          postal_code: formData.postalCode || null,
          payment_method: "bank_transfer",
          payment_status: "pending",
          bank_name: formData.bankName,
          bank_account_holder: formData.bankAccountHolder,
          bank_account_number: formData.bankAccountNumber,
          bank_transfer_reference: formData.bankTransferReference || null,
          approval_status: "pending",
        });

      if (orderError) throw orderError;

      const orderLines = cart.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: linesError } = await supabase
        .from("sales_order_lines")
        .insert(orderLines);

      if (linesError) throw linesError;

      clearCart();
      setOrderNumber(orderNum);
      setOrderPlaced(true);
      toast.success("تم تقديم الطلب بنجاح! سيتم مراجعته من قبل فريقنا.");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "فشل تقديم الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <Link to="/shop" className="text-2xl font-bold text-primary">
              المتجر
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">تم تقديم الطلب بنجاح!</h2>
          <p className="text-muted-foreground mb-4">
            شكراً لطلبك. رقم طلبك هو:
          </p>
          <p className="text-xl font-mono font-bold text-primary mb-6">
            {orderNumber}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              طلبك بانتظار المراجعة والموافقة. سيتم التواصل معك قريباً لتأكيد الطلب وترتيب التوصيل.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/shop")}>متابعة التسوق</Button>
            <Button variant="outline" onClick={() => navigate("/shop/account")}>
              عرض سجل الطلبات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    navigate("/shop/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <Link to="/shop" className="text-2xl font-bold text-primary">
            المتجر
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/shop/cart")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
          العودة للسلة
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    المعلومات الشخصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">الاسم الأول *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="محمد"
                      />
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">اسم الأب</Label>
                      <Input
                        id="fatherName"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        placeholder="أحمد"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grandfatherName">اسم الجد</Label>
                      <Input
                        id="grandfatherName"
                        name="grandfatherName"
                        value={formData.grandfatherName}
                        onChange={handleChange}
                        placeholder="علي"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">اسم العائلة *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="العربي"
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
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
                      <Label htmlFor="phone">رقم الهاتف *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+970 59 123 4567"
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>عنوان التوصيل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">الدولة / الإقليم *</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, country: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدولة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="الأراضي الفلسطينية">الأراضي الفلسطينية</SelectItem>
                          <SelectItem value="الأردن">الأردن</SelectItem>
                          <SelectItem value="مصر">مصر</SelectItem>
                          <SelectItem value="السعودية">السعودية</SelectItem>
                          <SelectItem value="الإمارات">الإمارات</SelectItem>
                          <SelectItem value="لبنان">لبنان</SelectItem>
                          <SelectItem value="سوريا">سوريا</SelectItem>
                          <SelectItem value="العراق">العراق</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.country && (
                        <p className="text-sm text-destructive">{errors.country}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">المدينة *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="رام الله"
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">العنوان / الشارع *</Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="شارع الإرسال، بجانب مركز البريد"
                    />
                    {errors.street && (
                      <p className="text-sm text-destructive">{errors.street}</p>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="building">رقم المبنى / العمارة</Label>
                      <Input
                        id="building"
                        name="building"
                        value={formData.building}
                        onChange={handleChange}
                        placeholder="عمارة 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floor">الطابق</Label>
                      <Input
                        id="floor"
                        name="floor"
                        value={formData.floor}
                        onChange={handleChange}
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">الرمز البريدي</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information - Bank Transfer Demo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    بيانات الدفع - تحويل بنكي (Demo)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 text-sm">
                      هذا النموذج للتجربة فقط (Demo). في النظام الفعلي، ستتم عملية الدفع من خلال بوابة دفع آمنة.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">اسم البنك *</Label>
                      <Select
                        value={formData.bankName}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, bankName: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر البنك" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="بنك فلسطين">بنك فلسطين</SelectItem>
                          <SelectItem value="البنك العربي">البنك العربي</SelectItem>
                          <SelectItem value="بنك القدس">بنك القدس</SelectItem>
                          <SelectItem value="البنك الوطني">البنك الوطني</SelectItem>
                          <SelectItem value="بنك الأردن">بنك الأردن</SelectItem>
                          <SelectItem value="بنك القاهرة عمان">بنك القاهرة عمان</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.bankName && (
                        <p className="text-sm text-destructive">{errors.bankName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountHolder">اسم صاحب الحساب *</Label>
                      <Input
                        id="bankAccountHolder"
                        name="bankAccountHolder"
                        value={formData.bankAccountHolder}
                        onChange={handleChange}
                        placeholder="الاسم كما يظهر في البنك"
                      />
                      {errors.bankAccountHolder && (
                        <p className="text-sm text-destructive">{errors.bankAccountHolder}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">رقم الحساب / IBAN *</Label>
                      <Input
                        id="bankAccountNumber"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        placeholder="PS00 0000 0000 0000 0000 0000"
                      />
                      {errors.bankAccountNumber && (
                        <p className="text-sm text-destructive">{errors.bankAccountNumber}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankTransferReference">رقم مرجع التحويل (اختياري)</Label>
                      <Input
                        id="bankTransferReference"
                        name="bankTransferReference"
                        value={formData.bankTransferReference}
                        onChange={handleChange}
                        placeholder="إذا تم التحويل مسبقاً"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>ملاحظات إضافية</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="أي تعليمات خاصة للتوصيل..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="truncate flex-1">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium mr-2">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الضريبة</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التوصيل</span>
                    <span className="text-green-600">سيتم تحديده</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري تقديم الطلب...
                      </>
                    ) : (
                      "تأكيد الطلب"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;