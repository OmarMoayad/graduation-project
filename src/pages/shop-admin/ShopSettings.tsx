import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Eye, EyeOff, Palette, Type, Image, LayoutGrid, Languages, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
interface Product {
  id: string;
  name: string;
  sku: string;
  is_active: boolean;
  image_url: string | null;
}

interface ShopConfig {
  primary_color: string;
  secondary_color: string;
  font_size: string;
  show_prices: boolean;
  show_stock: boolean;
  banner_image: string;
  welcome_text: string;
  welcome_text_ar: string;
}

const ShopSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [hiddenProducts, setHiddenProducts] = useState<Set<string>>(new Set());
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<ShopConfig>({
    primary_color: "#2ECC71",
    secondary_color: "#27AE60",
    font_size: "medium",
    show_prices: true,
    show_stock: false,
    banner_image: "",
    welcome_text: "Welcome to our store",
    welcome_text_ar: "مرحباً بكم في متجرنا",
  });

  const callAI = async (action: "translate" | "suggest", text: string, targetLang: "en" | "ar") => {
    const { data, error } = await supabase.functions.invoke("shop-ai-assistant", {
      body: { action, text, targetLang },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data.result;
  };

  const handleTranslate = async (from: "en" | "ar") => {
    const loadingKey = `translate-${from}`;
    setAiLoading(loadingKey);
    try {
      const sourceText = from === "en" ? config.welcome_text : config.welcome_text_ar;
      const targetLang = from === "en" ? "ar" : "en";
      
      if (!sourceText.trim()) {
        toast.error("يرجى إدخال نص أولاً");
        return;
      }

      const result = await callAI("translate", sourceText, targetLang);
      
      if (targetLang === "ar") {
        setConfig(prev => ({ ...prev, welcome_text_ar: result }));
      } else {
        setConfig(prev => ({ ...prev, welcome_text: result }));
      }
      toast.success("تمت الترجمة بنجاح");
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("فشلت الترجمة");
    } finally {
      setAiLoading(null);
    }
  };

  const handleSuggest = async (lang: "en" | "ar") => {
    const loadingKey = `suggest-${lang}`;
    setAiLoading(loadingKey);
    try {
      const result = await callAI("suggest", "", lang);
      
      if (lang === "ar") {
        setConfig(prev => ({ ...prev, welcome_text_ar: result }));
      } else {
        setConfig(prev => ({ ...prev, welcome_text: result }));
      }
      toast.success("تم اقتراح نص جديد");
    } catch (error) {
      console.error("Suggestion error:", error);
      toast.error("فشل في اقتراح النص");
    } finally {
      setAiLoading(null);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploadingBanner(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("shop-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("shop-assets")
        .getPublicUrl(filePath);

      setConfig(prev => ({ ...prev, banner_image: urlData.publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل في رفع الصورة");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleBannerUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleBannerUpload(file);
  };

  const removeBanner = () => {
    setConfig(prev => ({ ...prev, banner_image: "" }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, is_active, image_url")
        .order("name");

      if (productsError) throw productsError;
      setProducts(productsData || []);
      
      // Track hidden products (is_active = false)
      const hidden = new Set(
        (productsData || [])
          .filter(p => !p.is_active)
          .map(p => p.id)
      );
      setHiddenProducts(hidden);

      // Load shop settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("shop_settings")
        .select("*")
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine for new orgs
        console.error("Error loading settings:", settingsError);
      }

      if (settingsData) {
        setConfig({
          primary_color: settingsData.primary_color || "#2ECC71",
          secondary_color: settingsData.secondary_color || "#27AE60",
          font_size: settingsData.font_size || "medium",
          show_prices: settingsData.show_prices ?? true,
          show_stock: settingsData.show_stock ?? false,
          banner_image: settingsData.banner_image || "",
          welcome_text: settingsData.welcome_text || "Welcome to our store",
          welcome_text_ar: settingsData.welcome_text_ar || "مرحباً بكم في متجرنا",
        });
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductVisibility = async (productId: string, makeVisible: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: makeVisible })
        .eq("id", productId);

      if (error) throw error;

      setHiddenProducts(prev => {
        const next = new Set(prev);
        if (makeVisible) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      toast.success(makeVisible ? "تم إظهار المنتج" : "تم إخفاء المنتج");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("فشل في تحديث المنتج");
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);

      // Get user's organization_id
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userData.user.id)
        .single();

      if (!profile?.organization_id) throw new Error("Organization not found");

      // Check if settings already exist
      const { data: existingSettings } = await supabase
        .from("shop_settings")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .single();

      const settingsData = {
        organization_id: profile.organization_id,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        font_size: config.font_size,
        show_prices: config.show_prices,
        show_stock: config.show_stock,
        banner_image: config.banner_image,
        welcome_text: config.welcome_text,
        welcome_text_ar: config.welcome_text_ar,
      };

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from("shop_settings")
          .update(settingsData)
          .eq("id", existingSettings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("shop_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">إعدادات المتجر</h1>
            <p className="text-muted-foreground">تخصيص مظهر المتجر وإدارة المنتجات المعروضة</p>
          </div>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            حفظ التغييرات
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              المنتجات
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              المظهر
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              المحتوى
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  إدارة ظهور المنتجات
                </CardTitle>
                <CardDescription>
                  تحكم في المنتجات التي تظهر للزوار في المتجر الإلكتروني
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Image className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {hiddenProducts.has(product.id) ? "مخفي" : "ظاهر"}
                        </span>
                        <Button
                          variant={hiddenProducts.has(product.id) ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleProductVisibility(product.id, hiddenProducts.has(product.id))}
                        >
                          {hiddenProducts.has(product.id) ? (
                            <>
                              <Eye className="h-4 w-4 ml-1" />
                              إظهار
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 ml-1" />
                              إخفاء
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      لا توجد منتجات
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    الألوان
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>اللون الأساسي</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={config.primary_color}
                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>اللون الثانوي</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.secondary_color}
                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={config.secondary_color}
                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    حجم الخط
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {["small", "medium", "large"].map((size) => (
                      <Button
                        key={size}
                        variant={config.font_size === size ? "default" : "outline"}
                        onClick={() => setConfig({ ...config, font_size: size })}
                        className="capitalize"
                      >
                        {size === "small" ? "صغير" : size === "medium" ? "متوسط" : "كبير"}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>خيارات العرض</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>عرض الأسعار للزوار</Label>
                      <p className="text-sm text-muted-foreground">
                        إظهار أسعار المنتجات للزوار غير المسجلين
                      </p>
                    </div>
                    <Switch
                      checked={config.show_prices}
                      onCheckedChange={(checked) => setConfig({ ...config, show_prices: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>عرض المخزون المتاح</Label>
                      <p className="text-sm text-muted-foreground">
                        إظهار كمية المخزون المتوفرة للعملاء
                      </p>
                    </div>
                    <Switch
                      checked={config.show_stock}
                      onCheckedChange={(checked) => setConfig({ ...config, show_stock: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>محتوى الصفحة الرئيسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>نص الترحيب (الإنجليزية)</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggest("en")}
                        disabled={aiLoading !== null}
                      >
                        {aiLoading === "suggest-en" ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-1" />
                        ) : (
                          <Sparkles className="h-4 w-4 ml-1" />
                        )}
                        اقتراح AI
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTranslate("en")}
                        disabled={aiLoading !== null}
                      >
                        {aiLoading === "translate-en" ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-1" />
                        ) : (
                          <Languages className="h-4 w-4 ml-1" />
                        )}
                        ترجم للعربية
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={config.welcome_text}
                    onChange={(e) => setConfig({ ...config, welcome_text: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>نص الترحيب (العربية)</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggest("ar")}
                        disabled={aiLoading !== null}
                      >
                        {aiLoading === "suggest-ar" ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-1" />
                        ) : (
                          <Sparkles className="h-4 w-4 ml-1" />
                        )}
                        اقتراح AI
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTranslate("ar")}
                        disabled={aiLoading !== null}
                      >
                        {aiLoading === "translate-ar" ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-1" />
                        ) : (
                          <Languages className="h-4 w-4 ml-1" />
                        )}
                        ترجم للإنجليزية
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={config.welcome_text_ar}
                    onChange={(e) => setConfig({ ...config, welcome_text_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-3">
                  <Label>صورة البانر</Label>
                  
                  {/* Upload area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {uploadingBanner ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>
                      </div>
                    ) : config.banner_image ? (
                      <div className="space-y-3">
                        <img 
                          src={config.banner_image} 
                          alt="Banner preview" 
                          className="max-h-32 mx-auto rounded-lg object-cover"
                        />
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            <Upload className="h-4 w-4 ml-1" />
                            تغيير الصورة
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBanner();
                            }}
                          >
                            <X className="h-4 w-4 ml-1" />
                            إزالة
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Image className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          يمكنك سحب صورة إلى هنا أو <span className="text-primary underline">تحميل ملف</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* OR divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm text-muted-foreground">أو</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* URL input */}
                  <Input
                    value={config.banner_image}
                    onChange={(e) => setConfig({ ...config, banner_image: e.target.value })}
                    placeholder="لصق رابط الصورة"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ShopSettings;
