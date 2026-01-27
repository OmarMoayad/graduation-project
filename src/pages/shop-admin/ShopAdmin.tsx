import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Settings, 
  ExternalLink, 
  Package, 
  ShoppingBag,
  Palette,
  Image,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  is_active: boolean;
  image_url: string | null;
  sales_price: number | null;
}

interface Stats {
  totalProducts: number;
  visibleProducts: number;
  hiddenProducts: number;
  pendingOrders: number;
}

const ShopAdmin = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    visibleProducts: 0,
    hiddenProducts: 0,
    pendingOrders: 0,
  });
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, is_active, image_url, sales_price")
        .order("name");

      if (productsError) throw productsError;

      const prods = productsData || [];
      setProducts(prods);

      // Calculate stats
      const visible = prods.filter(p => p.is_active).length;
      const hidden = prods.filter(p => !p.is_active).length;

      // Load pending orders count
      const { count: pendingCount } = await supabase
        .from("sales_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        totalProducts: prods.length,
        visibleProducts: visible,
        hiddenProducts: hidden,
        pendingOrders: pendingCount || 0,
      });

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(isRTL ? "فشل في تحميل البيانات" : "Failed to load data");
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

      setProducts(prev => 
        prev.map(p => p.id === productId ? { ...p, is_active: makeVisible } : p)
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        visibleProducts: makeVisible ? prev.visibleProducts + 1 : prev.visibleProducts - 1,
        hiddenProducts: makeVisible ? prev.hiddenProducts - 1 : prev.hiddenProducts + 1,
      }));

      toast.success(makeVisible 
        ? (isRTL ? "تم إظهار المنتج" : "Product is now visible")
        : (isRTL ? "تم إخفاء المنتج" : "Product is now hidden")
      );
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(isRTL ? "فشل في تحديث المنتج" : "Failed to update product");
    }
  };

  const hideAllProducts = async () => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .neq("is_active", false);

      if (error) throw error;

      setProducts(prev => prev.map(p => ({ ...p, is_active: false })));
      setStats(prev => ({
        ...prev,
        visibleProducts: 0,
        hiddenProducts: prev.totalProducts,
      }));

      toast.success(isRTL ? "تم إخفاء جميع المنتجات" : "All products hidden");
    } catch (error) {
      console.error("Error:", error);
      toast.error(isRTL ? "فشل في العملية" : "Operation failed");
    }
  };

  const showAllProducts = async () => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: true })
        .neq("is_active", true);

      if (error) throw error;

      setProducts(prev => prev.map(p => ({ ...p, is_active: true })));
      setStats(prev => ({
        ...prev,
        visibleProducts: prev.totalProducts,
        hiddenProducts: 0,
      }));

      toast.success(isRTL ? "تم إظهار جميع المنتجات" : "All products visible");
    } catch (error) {
      console.error("Error:", error);
      toast.error(isRTL ? "فشل في العملية" : "Operation failed");
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isRTL ? "إدارة المتجر الإلكتروني" : "eCommerce Management"}
              </h1>
              <p className="text-muted-foreground">
                {isRTL ? "إدارة المنتجات والإعدادات والطلبات" : "Manage products, settings, and orders"}
              </p>
            </div>
          </div>
          <Button onClick={() => window.open("/shop", "_blank")} variant="outline">
            <ExternalLink className="h-4 w-4 me-2" />
            {isRTL ? "زيارة المتجر" : "Visit Store"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "إجمالي المنتجات" : "Total Products"}
                  </p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "منتجات ظاهرة" : "Visible Products"}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{stats.visibleProducts}</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "منتجات مخفية" : "Hidden Products"}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">{stats.hiddenProducts}</p>
                </div>
                <EyeOff className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/sales")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "طلبات قيد الانتظار" : "Pending Orders"}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingOrders}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/shop-admin/settings")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{isRTL ? "مظهر المتجر" : "Store Appearance"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "تخصيص الألوان والخطوط" : "Customize colors & fonts"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/shop-admin/settings")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{isRTL ? "البانر والمحتوى" : "Banner & Content"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "تعديل صور ونصوص الترحيب" : "Edit welcome images & text"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/sales")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{isRTL ? "إدارة الطلبات" : "Manage Orders"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "عرض ومعالجة الطلبات" : "View & process orders"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {isRTL ? "إدارة ظهور المنتجات" : "Product Visibility"}
                </CardTitle>
                <CardDescription>
                  {isRTL 
                    ? "تحكم في المنتجات التي تظهر للزوار في المتجر" 
                    : "Control which products are visible to store visitors"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={showAllProducts}>
                  <Eye className="h-4 w-4 me-1" />
                  {isRTL ? "إظهار الكل" : "Show All"}
                </Button>
                <Button variant="outline" size="sm" onClick={hideAllProducts}>
                  <EyeOff className="h-4 w-4 me-1" />
                  {isRTL ? "إخفاء الكل" : "Hide All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-[500px] overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    product.is_active 
                      ? "bg-green-50/50 border-green-200 hover:bg-green-50" 
                      : "bg-muted/30 border-muted hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{product.sku}</span>
                        {product.sales_price && (
                          <Badge variant="secondary" className="text-xs">
                            ₪{product.sales_price.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active 
                        ? (isRTL ? "ظاهر" : "Visible") 
                        : (isRTL ? "مخفي" : "Hidden")}
                    </Badge>
                    <Button
                      variant={product.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleProductVisibility(product.id, !product.is_active)}
                    >
                      {product.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4 me-1" />
                          {isRTL ? "إخفاء" : "Hide"}
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 me-1" />
                          {isRTL ? "إظهار" : "Show"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isRTL ? "لا توجد منتجات" : "No products found"}</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => navigate("/inventory/products/new")}
                  >
                    {isRTL ? "إضافة منتج جديد" : "Add new product"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ShopAdmin;
