import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Package, CheckCircle2, Loader2, Warehouse } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface OrderLine {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  received_quantity: number;
  product: {
    name: string;
    sku: string;
  };
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  order_date: string;
  expected_date: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  vendor: {
    id: string;
    name: string;
  };
}

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  useEffect(() => {
    loadPurchaseOrder();
    loadWarehouses();
  }, [id]);

  const loadWarehouses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      const { data } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true);

      setWarehouses(data || []);
      // Pre-select first warehouse if available
      if (data && data.length > 0) {
        setSelectedWarehouseId(data[0].id);
      }
    }
  };

  const loadPurchaseOrder = async () => {
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

      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          order_number,
          order_date,
          expected_date,
          status,
          total_amount,
          notes,
          vendor:contacts!vendor_id(id, name)
        `)
        .eq("id", id)
        .single();

      if (poError) throw poError;
      setPo(poData as any);

      const { data: linesData, error: linesError } = await supabase
        .from("purchase_order_lines")
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          received_quantity,
          product:products(name, sku)
        `)
        .eq("purchase_order_id", id);

      if (linesError) throw linesError;
      setLines(linesData as any || []);
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

  const handleReceive = async () => {
    if (!po || !organizationId) return;

    if (!selectedWarehouseId) {
      toast({
        title: "Error",
        description: "Please select a destination warehouse",
        variant: "destructive",
      });
      return;
    }

    setReceiving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create location for the selected warehouse
      let locationId = "";

      // Try to find default location
      const { data: existingLoc } = await supabase
        .from("locations")
        .select("id")
        .eq("warehouse_id", selectedWarehouseId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (existingLoc) {
        locationId = existingLoc.id;
      } else {
        // Create default location
        const { data: newLoc, error: locError } = await supabase
          .from("locations")
          .insert({
            organization_id: organizationId,
            warehouse_id: selectedWarehouseId,
            name: "Stock",
            location_type: "internal",
            is_active: true
          } as any)
          .select("id")
          .single();

        if (locError) throw locError;
        locationId = newLoc.id;
      }

      // Update stock for each line
      for (const line of lines) {
        // Check if stock quant exists for this product AND location
        const { data: existingQuant } = await supabase
          .from("stock_quants")
          .select("id, quantity")
          .eq("product_id", line.product_id)
          .eq("organization_id", organizationId)
          .eq("location_id", locationId)
          .maybeSingle();

        if (existingQuant) {
          // Update existing stock
          await supabase
            .from("stock_quants")
            .update({
              quantity: existingQuant.quantity + line.quantity,
            })
            .eq("id", existingQuant.id);
        } else {
          // Create new stock quant
          await supabase
            .from("stock_quants")
            .insert({
              product_id: line.product_id,
              organization_id: organizationId,
              quantity: line.quantity,
              location_id: locationId,
            });
        }

        // Create stock move
        await supabase
          .from("stock_moves")
          .insert({
            product_id: line.product_id,
            organization_id: organizationId,
            destination_location_id: locationId,
            quantity: line.quantity,
            move_type: "in",
            reference: `PO-${po.order_number}`,
            unit_cost: line.unit_price,
            total_cost: line.subtotal,
            created_by: user.id,
          });

        // Update or create vendor pricelist
        const { data: existingPrice } = await supabase
          .from("vendor_pricelists")
          .select("id")
          .eq("vendor_id", po.vendor.id)
          .eq("product_id", line.product_id)
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (existingPrice) {
          await supabase
            .from("vendor_pricelists")
            .update({
              unit_price: line.unit_price,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPrice.id);
        } else {
          await supabase
            .from("vendor_pricelists")
            .insert({
              vendor_id: po.vendor.id,
              product_id: line.product_id,
              organization_id: organizationId,
              unit_price: line.unit_price,
            });
        }

        // Update received quantity
        await supabase
          .from("purchase_order_lines")
          .update({ received_quantity: line.quantity })
          .eq("id", line.id);
      }

      // Update PO status
      await supabase
        .from("purchase_orders")
        .update({ status: "received" })
        .eq("id", po.id);

      toast({
        title: "Success",
        description: "Purchase order received successfully",
      });

      loadPurchaseOrder();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReceiving(false);
    }
  };

  const handleConvertToRFQ = async () => {
    if (!po) return;
    try {
      await supabase
        .from("purchase_orders")
        .update({ status: "rfq" })
        .eq("id", po.id);

      toast({
        title: "Success",
        description: "Converted to RFQ",
      });
      loadPurchaseOrder();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async () => {
    if (!po) return;
    try {
      await supabase
        .from("purchase_orders")
        .update({ status: "po" })
        .eq("id", po.id);

      toast({
        title: "Success",
        description: "Purchase order confirmed",
      });
      loadPurchaseOrder();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStartReceiving = async () => {
    if (!po) return;
    try {
      await supabase
        .from("purchase_orders")
        .update({ status: "receiving" })
        .eq("id", po.id);

      toast({
        title: "Success",
        description: "Started receiving process",
      });
      loadPurchaseOrder();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      rfq: "bg-gray-500",
      po: "bg-blue-500",
      receiving: "bg-yellow-500",
      received: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!po) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">Purchase order not found</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/purchases")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">{po.order_number}</h1>
            <Badge className={getStatusColor(po.status)}>{po.status.toUpperCase()}</Badge>
          </div>
          <div className="flex gap-2">
            {po.status === "draft" && (
              <Button onClick={handleConvertToRFQ}>
                Convert to RFQ
              </Button>
            )}
            {po.status === "rfq" && (
              <Button onClick={handleConfirm}>
                Confirm Order
              </Button>
            )}
            {po.status === "po" && (
              <Button onClick={handleStartReceiving}>
                <Package className="mr-2 h-4 w-4" />
                Start Receiving
              </Button>
            )}
            {po.status === "receiving" && (
              <Button onClick={handleReceive} disabled={receiving}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {receiving ? "Validating..." : "Validate Receipt"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-semibold">{po.vendor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(po.order_date).toLocaleDateString()}
                  </p>
                </div>
                {po.expected_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Date</p>
                    <p className="font-semibold">
                      {new Date(po.expected_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {po.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{po.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Lines:</span>
                <span className="font-semibold">{lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="text-2xl font-bold">
                  ₪{po.total_amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {po.status === "receiving" && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center text-primary text-base">
                  <Warehouse className="mr-2 h-4 w-4" />
                  Receiving Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Destination Warehouse</Label>
                  <Select
                    value={selectedWarehouseId}
                    onValueChange={setSelectedWarehouseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Select where the received products will be stored.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.product.name}</TableCell>
                    <TableCell>{line.product.sku}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{line.received_quantity}</TableCell>
                    <TableCell>₪{line.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">
                      ₪{line.subtotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
