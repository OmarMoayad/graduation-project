import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/hooks/use-cart";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, Home, Package } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                title="الصفحة الرئيسية"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Link to="/shop" className="text-2xl font-bold text-primary">
                المتجر
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-bold mb-2">سلة المشتريات فارغة</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            لم تقم بإضافة أي منتجات للسلة بعد. تصفح متجرنا واكتشف منتجاتنا المميزة!
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/shop")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            تصفح المنتجات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                title="الصفحة الرئيسية"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Link to="/shop" className="text-2xl font-bold text-primary">
                المتجر
              </Link>
            </div>
            <CurrencySelector />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/shop")}
          className="mb-6"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          متابعة التسوق
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">سلة المشتريات ({totalItems} منتج)</h1>
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 ml-2" />
                إفراغ السلة
              </Button>
            </div>

            {cart.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatPrice(item.price)}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 h-9 text-center font-medium"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                      <p className="font-bold text-lg">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>المجموع الفرعي ({totalItems} منتج)</span>
                  <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>الضريبة</span>
                  <span className="text-green-600 font-medium">مجاناً</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>الشحن</span>
                  <span className="text-muted-foreground text-sm">يحدد عند الدفع</span>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-xl font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  size="lg"
                  onClick={() => navigate("/shop/checkout")}
                >
                  إتمام الشراء
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
