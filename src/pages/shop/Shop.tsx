import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, ShoppingCart, Loader2, User, Home, Package, Sparkles, TrendingUp, Star, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/use-cart";
import { useCurrency } from "@/hooks/use-currency";
import CurrencySelector from "@/components/CurrencySelector";
import { getShopOrganization } from "@/lib/shop-config";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  sku: string;
  sales_price: number | null;
  image_url: string | null;
  description: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const Shop = () => {
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const shopOrg = await getShopOrganization();
      
      if (!shopOrg) {
        toast.error("المتجر غير مهيأ بشكل صحيح");
        setLoading(false);
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, sales_price, image_url, description, category_id")
        .eq("organization_id", shopOrg.id)
        .eq("is_active", true)
        .gt("sales_price", 0)
        .order("name");

      if (productsError) throw productsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("product_categories")
        .select("id, name")
        .eq("organization_id", shopOrg.id)
        .eq("is_active", true)
        .order("name");

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error loading shop data:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        search === "" ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || product.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sales_price || 0,
      image_url: product.image_url,
    });
    toast.success(`تمت إضافة ${product.name} للسلة`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-primary/10"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Link to="/shop" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  المتجر
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <CurrencySelector />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/shop/account")}
                className="hover:bg-primary/10"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                className="relative gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={() => navigate("/shop/cart")}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">السلة</span>
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="h-3 w-3 ml-1" />
              تسوق الآن
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              اكتشف منتجاتنا المميزة
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              تشكيلة واسعة من المنتجات بأفضل الأسعار
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Pills */}
      {categories.length > 0 && (
        <div className="container mx-auto px-4 py-4 border-b">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="shrink-0"
            >
              الكل
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-muted/50 border-0 focus-visible:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{filteredProducts.length} منتج</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">لم يتم العثور على منتجات</h3>
            <p className="text-muted-foreground mb-4">جرب البحث بكلمات مختلفة</p>
            <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory("all"); }}>
              <ArrowLeft className="h-4 w-4 ml-2" />
              إعادة ضبط البحث
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur">
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Quick Add Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <Button
                        size="sm"
                        className="bg-white/90 text-foreground hover:bg-white gap-1"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-3 w-3" />
                        إضافة سريعة
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2rem]">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(product.sales_price || 0)}
                      </p>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs">4.5</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      أضف للسلة
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 المتجر الإلكتروني - جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Shop;
