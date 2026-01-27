import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderLine {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    vendor_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_date: "",
    notes: "",
  });

  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [newLine, setNewLine] = useState({
    product_id: "",
    quantity: 1,
    unit_price: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;
      setOrganizationId(profile.organization_id);

      // Load vendors
      const { data: vendorsData } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("organization_id", profile.organization_id)
        .eq("is_vendor", true)
        .eq("is_active", true);

      setVendors(vendorsData || []);

      // Load products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, sku, cost_price")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true);

      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addOrderLine = () => {
    if (!newLine.product_id || newLine.quantity <= 0 || newLine.unit_price <= 0) {
      toast({
        title: "Invalid line",
        description: "Please select a product and enter valid quantity and price",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p) => p.id === newLine.product_id);
    if (!product) return;

    const line: OrderLine = {
      id: Math.random().toString(),
      product_id: newLine.product_id,
      product_name: `${product.name} (${product.sku})`,
      quantity: newLine.quantity,
      unit_price: newLine.unit_price,
      subtotal: newLine.quantity * newLine.unit_price,
    };

    setOrderLines([...orderLines, line]);
    setNewLine({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const removeLine = (id: string) => {
    setOrderLines(orderLines.filter((line) => line.id !== id));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setNewLine({
      ...newLine,
      product_id: productId,
      unit_price: product?.cost_price || 0,
    });
  };

  const calculateTotal = () => {
    return orderLines.reduce((sum, line) => sum + line.subtotal, 0);
  };

  const generateOrderNumber = () => {
    const prefix = "PO";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendor_id) {
      toast({
        title: "Missing vendor",
        description: "Please select a vendor",
        variant: "destructive",
      });
      return;
    }

    if (orderLines.length === 0) {
      toast({
        title: "No products",
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const orderNumber = generateOrderNumber();
      const totalAmount = calculateTotal();

      // Create purchase order
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          organization_id: organizationId,
          vendor_id: formData.vendor_id,
          order_number: orderNumber,
          order_date: formData.order_date,
          expected_date: formData.expected_date || null,
          status: "draft",
          total_amount: totalAmount,
          notes: formData.notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create order lines
      const lines = orderLines.map((line) => ({
        purchase_order_id: poData.id,
        product_id: line.product_id,
        quantity: line.quantity,
        unit_price: line.unit_price,
        subtotal: line.subtotal,
      }));

      const { error: linesError } = await supabase
        .from("purchase_order_lines")
        .insert(lines);

      if (linesError) throw linesError;

      toast({
        title: "Success",
        description: `Purchase order ${orderNumber} created successfully`,
      });

      navigate("/purchases");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/purchases")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Create Purchase Order</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Select
                      value={formData.vendor_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, vendor_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order_date">Order Date *</Label>
                    <Input
                      id="order_date"
                      type="date"
                      value={formData.order_date}
                      onChange={(e) =>
                        setFormData({ ...formData, order_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_date">Expected Date</Label>
                    <Input
                      id="expected_date"
                      type="date"
                      value={formData.expected_date}
                      onChange={(e) =>
                        setFormData({ ...formData, expected_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Lines:</span>
                  <span className="font-semibold">{orderLines.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="text-2xl font-bold">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Purchase Order"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="md:col-span-2">
                  <Label>Product</Label>
                  <Select
                    value={newLine.product_id}
                    onValueChange={handleProductChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={newLine.quantity}
                    onChange={(e) =>
                      setNewLine({
                        ...newLine,
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newLine.unit_price}
                    onChange={(e) =>
                      setNewLine({
                        ...newLine,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button type="button" onClick={addOrderLine} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              {orderLines.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.product_name}</TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>${line.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">
                          ${line.subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(line.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
