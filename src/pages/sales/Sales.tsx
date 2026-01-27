import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Eye, ShoppingBag, CheckCircle, XCircle, Clock, Truck, Warehouse } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SalesOrder {
  id: string;
  order_number: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  subtotal: number;
  total_amount: number;
  created_at: string;
  portal_user_id: string | null;
  customer_id: string | null;
  approval_status: string | null;
  payment_status: string | null;
  city: string | null;
  country: string | null;
}

interface DeliveryCompany {
  id: string;
  name: string;
  name_ar: string | null;
}

const Sales = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");

  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>([]);
  const [selectedDeliveryCompany, setSelectedDeliveryCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [approving, setApproving] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    loadOrders();
    loadDeliveryCompanies();
    loadWarehouses();
  }, []);

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

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sales_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_companies")
        .select("id, name, name_ar")
        .eq("is_active", true);

      if (error) throw error;
      setDeliveryCompanies(data || []);
    } catch (error) {
      console.error("Error loading delivery companies:", error);
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

  const getApprovalColor = (status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "pending":
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  const getApprovalLabel = (status: string | null) => {
    switch (status) {
      case "approved":
        return "تمت الموافقة";
      case "rejected":
        return "مرفوض";
      case "pending":
      default:
        return "بانتظار الموافقة";
    }
  };

  const openApprovalDialog = (order: SalesOrder, action: "approve" | "reject") => {
    setSelectedOrder(order);
    setApprovalAction(action);
    setRejectionReason("");
    setSelectedDeliveryCompany("");
    setTrackingNumber("");
    setApprovalDialog(true);
  };

  const handleStockDeduction = async (orderId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // 1. Fetch order lines
      const { data: lines, error: linesError } = await supabase
        .from("sales_order_lines")
        .select(`
        *,
        product:products(name)
      `)
        .eq("order_id", orderId);

      if (linesError || !lines) {
        console.error("Error fetching lines:", linesError);
        toast.error("فشل في جلب تفاصيل الطلب");
        return false;
      }

      // 2. Validate stock availability
      for (const line of lines) {
        const { data: quants } = await supabase
          .from("stock_quants")
          .select(`
          quantity, 
          id, 
          location_id,
          location:locations!inner (
            warehouse_id
          )
        `)
          .eq("product_id", line.product_id)
          .eq("organization_id", organizationId)
          .eq("location.warehouse_id", selectedWarehouseId)
          .gt("quantity", 0);

        let availableQty = 0;
        if (quants) {
          availableQty = quants.reduce((sum, q) => sum + q.quantity, 0);
        }

        if (availableQty < line.quantity) {
          toast.error(`رصيد غير كافي للمنتج: ${line.product?.name || 'غير معروف'}. المتوفر: ${availableQty}، المطلوب: ${line.quantity} في المستودع المحدد.`);
          return false;
        }
      }

      // 3. Deduct stock
      for (const line of lines) {
        let remainingQtyToDeduct = line.quantity;

        const { data: quants } = await supabase
          .from("stock_quants")
          .select(`
          quantity, 
          id, 
          location_id,
          location:locations!inner (
            warehouse_id
          )
        `)
          .eq("product_id", line.product_id)
          .eq("organization_id", organizationId)
          .eq("location.warehouse_id", selectedWarehouseId)
          .gt("quantity", 0)
          .order("quantity", { ascending: true });

        if (quants) {
          for (const quant of quants) {
            if (remainingQtyToDeduct <= 0) break;

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
                reference: `SO-${selectedOrder?.order_number}`,
                created_by: user.id
              });

            remainingQtyToDeduct -= deduct;
          }
        }
      }
      return true;

    } catch (error) {
      console.error("Stock deduction error:", error);
      toast.error("فشل في تحديث المخزون");
      return false;
    }
  };

  const handleApproval = async () => {
    if (!selectedOrder) return;

    if (approvalAction === "approve") {
      if (!selectedDeliveryCompany) {
        toast.error("يرجى اختيار شركة التوصيل");
        return;
      }
      if (!selectedWarehouseId) {
        toast.error("يرجى اختيار المستودع");
        return;
      }

      // Check and deduct stock
      const success = await handleStockDeduction(selectedOrder.id);
      if (!success) return;
    }

    if (approvalAction === "reject" && !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    setApproving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (approvalAction === "approve") {
        // Update order
        const { error: orderError } = await supabase
          .from("sales_orders")
          .update({
            approval_status: "approved",
            status: "confirmed",
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
            delivery_company_id: selectedDeliveryCompany,
            tracking_number: trackingNumber || null,
          })
          .eq("id", selectedOrder.id);

        if (orderError) throw orderError;

        // Log approval
        await supabase.from("order_approvals").insert({
          order_id: selectedOrder.id,
          action: "approved",
          approved_by: user?.id,
          notes: `تمت الموافقة وتم تحويله لشركة التوصيل`,
        });

        toast.success("تمت الموافقة على الطلب وتحويله لشركة التوصيل");
      } else {
        // Reject order
        const { error: orderError } = await supabase
          .from("sales_orders")
          .update({
            approval_status: "rejected",
            status: "cancelled",
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
            rejection_reason: rejectionReason,
          })
          .eq("id", selectedOrder.id);

        if (orderError) throw orderError;

        // Log rejection
        await supabase.from("order_approvals").insert({
          order_id: selectedOrder.id,
          action: "rejected",
          approved_by: user?.id,
          notes: rejectionReason,
        });

        toast.success("تم رفض الطلب");
      }

      setApprovalDialog(false);
      loadOrders();
    } catch (error: any) {
      console.error("Error processing approval:", error);
      toast.error(error.message || "فشل معالجة الطلب");
    } finally {
      setApproving(false);
    }
  };


  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      search === "" ||
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.guest_email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    const matchesApproval =
      approvalFilter === "all" || order.approval_status === approvalFilter;

    return matchesSearch && matchesStatus && matchesApproval;
  });

  return (
    <AppLayout>
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            إدارة الطلبات
          </h1>
          <p className="text-muted-foreground">
            مراجعة والموافقة على طلبات المتجر الإلكتروني
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <CardTitle>قائمة الطلبات</CardTitle>
                <CardDescription>
                  {orders.length} طلب | {orders.filter(o => o.approval_status === "pending").length} بانتظار الموافقة
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10 w-[200px]"
                  />
                </div>
                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="حالة الموافقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="pending">بانتظار الموافقة</SelectItem>
                    <SelectItem value="approved">تمت الموافقة</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                    <SelectItem value="processing">قيد التجهيز</SelectItem>
                    <SelectItem value="shipped">تم الشحن</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد طلبات</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>حالة الموافقة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.guest_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{order.guest_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.city || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getApprovalColor(order.approval_status)}
                        >
                          {getApprovalLabel(order.approval_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        ${order.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), "PP")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {order.approval_status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => openApprovalDialog(order, "approve")}
                              >
                                <CheckCircle className="h-4 w-4 ml-1" />
                                موافقة
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openApprovalDialog(order, "reject")}
                              >
                                <XCircle className="h-4 w-4 ml-1" />
                                رفض
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/sales/${order.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {approvalAction === "approve" ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    الموافقة على الطلب
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    رفض الطلب
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {approvalAction === "approve"
                  ? "اختر شركة التوصيل لتحويل الطلب إليها"
                  : "أدخل سبب رفض الطلب"}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">رقم الطلب:</span>{" "}
                    <span className="font-mono font-bold">{selectedOrder.order_number}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">العميل:</span>{" "}
                    {selectedOrder.guest_name}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">المبلغ:</span>{" "}
                    <span className="font-bold">${selectedOrder.total_amount.toFixed(2)}</span>
                  </p>
                </div>

                {approvalAction === "approve" ? (
                  <>
                    <div className="space-y-2">
                      <Label>شركة التوصيل *</Label>
                      <Select
                        value={selectedDeliveryCompany}
                        onValueChange={setSelectedDeliveryCompany}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر شركة التوصيل" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name_ar || company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>المستودع (للصرف) *</Label>
                      <Select
                        value={selectedWarehouseId}
                        onValueChange={setSelectedWarehouseId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستودع" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>رقم التتبع (اختياري)</Label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="رقم تتبع الشحنة"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>سبب الرفض *</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="اكتب سبب رفض الطلب..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setApprovalDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleApproval}
                disabled={approving}
                className={
                  approvalAction === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {approving ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : approvalAction === "approve" ? (
                  <Truck className="h-4 w-4 ml-2" />
                ) : (
                  <XCircle className="h-4 w-4 ml-2" />
                )}
                {approvalAction === "approve" ? "موافقة وتحويل للتوصيل" : "رفض الطلب"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Sales;