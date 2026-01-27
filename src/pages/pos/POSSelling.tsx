import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, ShoppingCart, CreditCard, Banknote, Smartphone, Building2, X, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  sales_price: number;
  image_url: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export default function POSSelling() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [organizationId, setOrganizationId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [receivedAmount, setReceivedAmount] = useState("");

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadProducts();
      verifySession();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
    }
  };

  const verifySession = async () => {
    const { data: session } = await supabase
      .from("pos_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("organization_id", organizationId)
      .single();

    if (!session || session.status !== "open") {
      toast.error("Invalid or closed session");
      navigate("/pos");
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, sales_price, image_url")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("name");

    setProducts(data || []);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * product.sales_price,
            }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          subtotal: product.sales_price,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) return null;
            return {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.sales_price,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getChangeAmount = () => {
    const received = parseFloat(receivedAmount) || 0;
    return received - getTotalAmount();
  };

  const handlePayment = async () => {
    if (!sessionId) {
      toast.error("No active session");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const totalAmount = getTotalAmount();
      const orderNumber = `POS-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("pos_orders")
        .insert({
          organization_id: organizationId,
          session_id: sessionId,
          order_number: orderNumber,
          subtotal: totalAmount,
          total_amount: totalAmount,
          status: "paid",
          created_by: user.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order lines
      const orderLines = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.sales_price,
        subtotal: item.subtotal,
      }));

      const { error: linesError } = await supabase
        .from("pos_order_lines")
        .insert(orderLines);

      if (linesError) throw linesError;

      // Create payment
      const { error: paymentError } = await supabase
        .from("pos_payments")
        .insert({
          order_id: order.id,
          payment_method: paymentMethod as any,
          amount: totalAmount,
        });

      if (paymentError) throw paymentError;

      // Update stock for each product (deduct from warehouses and branches)
      for (const item of cart) {
        let remainingToDeduct = item.quantity;

        // 1. First, try to deduct from warehouse stock_quants
        const { data: warehouseQuants } = await supabase
          .from("stock_quants")
          .select("id, quantity, location_id, location:locations(id, name, warehouse_id)")
          .eq("product_id", item.product.id)
          .eq("organization_id", organizationId)
          .gt("quantity", 0)
          .order("quantity", { ascending: false });

        if (warehouseQuants && warehouseQuants.length > 0) {
          for (const quant of warehouseQuants) {
            if (remainingToDeduct <= 0) break;

            const deductAmount = Math.min(remainingToDeduct, Number(quant.quantity));
            const newQuantity = Number(quant.quantity) - deductAmount;

            // Update the stock quant
            await supabase
              .from("stock_quants")
              .update({ quantity: newQuantity })
              .eq("id", quant.id);

            // Create stock move with proper source location
            await supabase
              .from("stock_moves")
              .insert({
                product_id: item.product.id,
                organization_id: organizationId,
                source_location_id: quant.location_id,
                quantity: deductAmount,
                move_type: "out",
                reference: orderNumber,
                notes: `POS Sale - ${orderNumber}`,
                created_by: user.id,
              });

            remainingToDeduct -= deductAmount;
          }
        }

        // 2. If still need to deduct, try branch_stock
        if (remainingToDeduct > 0) {
          const { data: branchStocks } = await supabase
            .from("branch_stock")
            .select("id, quantity, branch_id")
            .eq("product_id", item.product.id)
            .eq("organization_id", organizationId)
            .gt("quantity", 0)
            .order("quantity", { ascending: false });

          if (branchStocks && branchStocks.length > 0) {
            for (const branchStock of branchStocks) {
              if (remainingToDeduct <= 0) break;

              const deductAmount = Math.min(remainingToDeduct, Number(branchStock.quantity));
              const newQuantity = Number(branchStock.quantity) - deductAmount;

              // Update branch stock
              await supabase
                .from("branch_stock")
                .update({ quantity: newQuantity })
                .eq("id", branchStock.id);

              // Create stock move for branch deduction
              await supabase
                .from("stock_moves")
                .insert({
                  product_id: item.product.id,
                  organization_id: organizationId,
                  quantity: deductAmount,
                  move_type: "out",
                  reference: orderNumber,
                  notes: `POS Sale from Branch - ${orderNumber}`,
                  created_by: user.id,
                });

              remainingToDeduct -= deductAmount;
            }
          }
        }

        // Warn if we couldn't deduct all the quantity
        if (remainingToDeduct > 0) {
          console.warn(`Could not deduct ${remainingToDeduct} units of ${item.product.name} - insufficient stock`);
        }
      }

      toast.success("Order completed successfully");
      setCart([]);
      setShowPayment(false);
      setReceivedAmount("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <Button variant="outline" onClick={() => navigate("/pos")}>
          Close Session
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                  <p className="text-lg font-bold">₪{product.sales_price.toFixed(2)}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Current Order
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <Card key={item.product.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₪{item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span>₪{getTotalAmount().toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setShowPayment(true)}
            >
              Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
              <p className="text-3xl font-bold">₪{getTotalAmount().toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                  className="flex items-center gap-2"
                >
                  <Banknote className="h-4 w-4" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("card")}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </Button>
                <Button
                  variant={paymentMethod === "mobile_payment" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("mobile_payment")}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </Button>
                <Button
                  variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Bank
                </Button>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Received Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="0.00"
                />
                {receivedAmount && parseFloat(receivedAmount) >= getTotalAmount() && (
                  <p className="text-sm">
                    Change: <span className="font-bold">₪{getChangeAmount().toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={
                paymentMethod === "cash" &&
                (!receivedAmount || parseFloat(receivedAmount) < getTotalAmount())
              }
            >
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
