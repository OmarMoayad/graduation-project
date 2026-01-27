import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Warehouse
} from "lucide-react";
import { format } from "date-fns";

interface OrderLine {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_percent: number | null;
  product: {
    name: string;
    sku: string;
    image_url: string | null;
  } | null;
}

interface SalesOrder {
  id: string;
  order_number: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  subtotal: number;
  tax_amount: number | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  portal_user_id: string | null;
  customer_id: string | null;
}

const statusSteps = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Clock },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

const SalesOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    if (id) {
      loadOrder();
      loadWarehouses();
    }
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
      setOrganizationId(profile.organization_id);
      const { data } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true);

      setWarehouses(data || []);
      if (data && data.length > 0) {
        setSelectedWarehouseId(data[0].id);
      }
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);

      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Load order lines with products
      const { data: linesData, error: linesError } = await supabase
        .from("sales_order_lines")
        .select(`
          *,
          product:products(name, sku, image_url)
        `)
        .eq("order_id", id);

      if (linesError) throw linesError;
      setOrderLines(linesData || []);
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error("Failed to load order details");
      navigate("/sales");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;

    // Require warehouse for confirmation/shipping if not already completed/cancelled
    if ((newStatus === "confirmed" || newStatus === "shipped") &&
      order.status !== "confirmed" &&
      order.status !== "shipped" &&
      order.status !== "completed") {

      if (!selectedWarehouseId) {
        toast.error("Please select a fulfillment warehouse first");
        return;
      }

      // Check and deduct stock
      const success = await handleStockDeduction();
      if (!success) return; // Stop if deduction failed
    }

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("sales_orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleStockDeduction = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Validate stock availability first
      for (const line of orderLines) {
        // Find stock in the selected warehouse
        const { data: quants } = await supabase
          .from("stock_quants")
          .select("quantity, id, location_id")
          .eq("product_id", line.product_id)
          .eq("organization_id", organizationId)
          .gt("quantity", 0);

        // Filter for locations in the selected warehouse
        // We need to check locations table to filter by warehouse_id
        let availableQty = 0;
        const validQuants: any[] = [];

        if (quants) {
          for (const quant of quants) {
            const { data: loc } = await supabase
              .from("locations")
              .select("warehouse_id")
              .eq("id", quant.location_id)
              .single();

            if (loc && loc.warehouse_id === selectedWarehouseId) {
              availableQty += quant.quantity;
              validQuants.push(quant);
            }
          }
        }

        if (availableQty < line.quantity) {
          toast.error(`Insufficient stock for product: ${line.product?.name || 'Unknown'}. Available: ${availableQty}, Required: ${line.quantity} in selected warehouse.`);
          return false;
        }
      }

      // Proceed with deduction
      for (const line of orderLines) {
        let remainingQtyToDeduct = line.quantity;

        // Fetch quants again to be safe
        const { data: quants } = await supabase
          .from("stock_quants")
          .select("quantity, id, location_id")
          .eq("product_id", line.product_id)
          .eq("organization_id", organizationId)
          .gt("quantity", 0)
          .order("quantity", { ascending: true }); // FIFO-ish (smallest batches first to clear them) or sort by date if available

        if (quants) {
          for (const quant of quants) {
            if (remainingQtyToDeduct <= 0) break;

            const { data: loc } = await supabase
              .from("locations")
              .select("warehouse_id")
              .eq("id", quant.location_id)
              .single();

            if (loc && loc.warehouse_id === selectedWarehouseId) {
              const deduct = Math.min(quant.quantity, remainingQtyToDeduct);

              // Update quant
              await supabase
                .from("stock_quants")
                .update({ quantity: quant.quantity - deduct })
                .eq("id", quant.id);

              // Record move
              await supabase
                .from("stock_moves")
                .insert({
                  product_id: line.product_id,
                  organization_id: organizationId,
                  source_location_id: quant.location_id,
                  quantity: deduct,
                  move_type: "out",
                  reference: `SO-${order?.order_number}`,
                  created_by: user.id
                });

              remainingQtyToDeduct -= deduct;
            }
          }
        }
      }

      return true;

    } catch (error) {
      console.error("Stock deduction error:", error);
      toast.error("Failed to update inventory");
      return false;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "processing":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "shipped":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === "cancelled") return -1;
    return statusSteps.findIndex((step) => step.key === order.status);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Order not found</p>
          <Button onClick={() => navigate("/sales")}>Back to Sales</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Order #{order.order_number}
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Created on {format(new Date(order.created_at), "PPP 'at' p")}
            </p>
          </div>
          <div className="flex gap-2">
            {order.status !== "cancelled" && order.status !== "completed" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <XCircle className="h-4 w-4 me-2" />
                    Cancel Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The order will be marked as cancelled.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => updateStatus("cancelled")}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {order.status !== "cancelled" && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const currentIndex = getCurrentStepIndex();
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                            } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium ${isCompleted ? "text-primary" : "text-muted-foreground"
                            }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`flex-1 h-1 mx-2 rounded ${index < currentIndex ? "bg-primary" : "bg-muted"
                            }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Lines */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
                <CardDescription>
                  {orderLines.length} item(s) in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-end">Unit Price</TableHead>
                      <TableHead className="text-end">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                              {line.product?.image_url ? (
                                <img
                                  src={line.product.image_url}
                                  alt={line.product?.name || "Product"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {line.product?.name || "Unknown Product"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {line.product?.sku || "N/A"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="text-end">
                          ${line.unit_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-end font-medium">
                          ${line.subtotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.tax_amount && order.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${order.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fulfillment Warehouse */}
            {order.status === "draft" || order.status === "confirmed" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Warehouse className="h-4 w-4" />
                    Fulfillment Warehouse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedWarehouseId}
                    onValueChange={setSelectedWarehouseId}
                    disabled={order.status !== "draft"}
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
                    Select warehouse to fulfill items from upon confirmation.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {/* Update Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={order.status}
                  onValueChange={updateStatus}
                  disabled={updating || order.status === "cancelled"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="confirmed">Confirmed (Deduct Stock)</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {updating && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.guest_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.guest_name}</span>
                  </div>
                )}
                {order.guest_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${order.guest_email}`} className="text-primary hover:underline">
                      {order.guest_email}
                    </a>
                  </div>
                )}
                {order.guest_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${order.guest_phone}`} className="text-primary hover:underline">
                      {order.guest_phone}
                    </a>
                  </div>
                )}
                {!order.guest_name && !order.guest_email && !order.guest_phone && (
                  <p className="text-sm text-muted-foreground">
                    {order.portal_user_id ? "Portal User" : "No customer info"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-4 w-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{order.shipping_address}</p>
                </CardContent>
              </Card>
            )}

            {/* Billing Address */}
            {order.billing_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{order.billing_address}</p>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(order.created_at), "PP")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(order.updated_at), "PP")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SalesOrderDetail;