import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Warehouse, MapPin, Loader2, Pencil, Trash2, Eye, PackageOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WarehouseType {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    phone: "",
    email: ""
  });
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [viewingWarehouse, setViewingWarehouse] = useState<WarehouseType | null>(null);
  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadWarehouses();
      loadStockCounts();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
    }
  };

  const loadWarehouses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load warehouses");
    } else {
      setWarehouses(data || []);
    }
    setLoading(false);

  };

  const loadStockCounts = async () => {
    const { data } = await supabase
      .from("stock_quants")
      .select(`
        quantity,
        location:locations!inner(warehouse_id)
      `)
      .eq("organization_id", organizationId);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((item: any) => {
        const whId = item.location?.warehouse_id;
        if (whId) {
          counts[whId] = (counts[whId] || 0) + item.quantity;
        }
      });
      setStockCounts(counts);
    }
  };


  const consolidateStock = async (stockItems: any[]) => {
    // Group by (product_id, location_id)
    const groups: Record<string, any[]> = {};
    stockItems.forEach(item => {
      const key = `${item.product?.id}_${item.location?.id}`;
      // Also check for "Stock" location duplicates by name if ID differs but they are effectively the same location type
      // But safest is ID.
      // Let's also group by strict Product ID + Warehouse ID to catch split stock across shelves that user wants merged?
      // No, user might want shelves.
      // But user's specific bug is "Duplicate rows".
      // Let's group by Product ID and Location ID first.
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let fixedCount = 0;
    for (const key in groups) {
      const items = groups[key];
      if (items.length > 1) {
        // DUPLICATE FOUND: Same Product, Same Location ID!
        const master = items[0];
        const others = items.slice(1);
        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

        // Update master
        await supabase.from("stock_quants").update({ quantity: totalQty }).eq("id", master.id);

        // Delete others
        for (const other of others) {
          await supabase.from("stock_quants").delete().eq("id", other.id);
        }
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      toast.success(`تم دمج ${fixedCount} سجلات مكررة تلقائياً`, {
        description: "تم تحديث القائمة لعرض الكميات الصحيحة"
      });
      // Return true to signal reload
      return true;
    }
    return false;
  };

  const handleViewStock = async (warehouse: WarehouseType) => {
    setViewingWarehouse(warehouse);
    setLoadingStock(true);

    const { data } = await supabase
      .from("stock_quants")
      .select(`
        id,
        quantity,
        product:products(id, name, sku, image_url),
        location:locations!inner(id, name, warehouse_id)
      `)
      .eq("organization_id", organizationId)
      .eq("location.warehouse_id", warehouse.id)
      .gt("quantity", 0);

    if (data) {
      // Auto-cleanup strict duplicates (Same Product, Same Location ID)
      const neededFix = await consolidateStock(data);
      if (neededFix) {
        // Reload
        handleViewStock(warehouse);
        return;
      }
      setWarehouseStock(data);
    }
    setLoadingStock(false);
  };

  const handleRemoveFromWarehouse = async (quantId: string, productName: string) => {
    if (confirm(`هل أنت متأكد من حذف مخزون "${productName}" ؟`)) {
      try {
        const { error } = await supabase
          .from("stock_quants")
          .delete()
          .eq("id", quantId);

        if (error) throw error;

        toast.success("تم حذف المنتج من المخزن");

        // Refresh
        if (viewingWarehouse) {
          handleViewStock(viewingWarehouse);
        }
        loadStockCounts();
      } catch (error) {
        console.error("Error deleting stock:", error);
        toast.error("فشل حذف المنتج");
      }
    }
  };

  const generateCode = () => {
    const prefix = "WH";
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${random}`;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      phone: "",
      email: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = formData.code || generateCode();

    const { data: newWarehouse, error } = await supabase.from("warehouses").insert({
      organization_id: organizationId,
      name: formData.name,
      code,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postal_code || null,
      phone: formData.phone || null,
      email: formData.email || null
    } as any)
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Failed to create warehouse");
    } else if (newWarehouse) {
      // Create default location for the new warehouse
      await supabase.from("locations").insert({
        organization_id: organizationId,
        warehouse_id: newWarehouse.id,
        name: "Stock", // Default general location
        location_type: "internal",
        is_active: true
      });

      toast.success("Warehouse created successfully");
      setIsDialogOpen(false);
      resetForm();
      loadWarehouses();
    }
  };

  const handleEdit = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || "",
      city: warehouse.city || "",
      state: warehouse.state || "",
      country: warehouse.country || "",
      postal_code: "",
      phone: warehouse.phone || "",
      email: warehouse.email || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;

    const { error } = await supabase
      .from("warehouses")
      .update({
        name: formData.name,
        code: formData.code,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        phone: formData.phone || null,
        email: formData.email || null
      })
      .eq("id", selectedWarehouse.id);

    if (error) {
      toast.error(error.message || "Failed to update warehouse");
    } else {
      toast.success("تم تحديث المخزن بنجاح");
      setIsEditDialogOpen(false);
      setSelectedWarehouse(null);
      resetForm();
      loadWarehouses();
    }
  };

  const handleDelete = async () => {
    if (!selectedWarehouse) return;

    // Archive instead of delete (set is_active to false)
    const { error } = await supabase
      .from("warehouses")
      .update({ is_active: false })
      .eq("id", selectedWarehouse.id);

    if (error) {
      toast.error(error.message || "Failed to archive warehouse");
    } else {
      toast.success("تم أرشفة المخزن بنجاح");
      setIsDeleteDialogOpen(false);
      setSelectedWarehouse(null);
      loadWarehouses();
    }
  };

  const handleToggleActive = async (warehouse: WarehouseType) => {
    const { error } = await supabase
      .from("warehouses")
      .update({ is_active: !warehouse.is_active })
      .eq("id", warehouse.id);

    if (error) {
      toast.error("Failed to update warehouse status");
    } else {
      toast.success(warehouse.is_active ? "تم إلغاء تفعيل المخزن" : "تم تفعيل المخزن");
      loadWarehouses();
    }
  };

  const WarehouseForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">اسم المخزن *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">الرمز (اتركه فارغاً للتوليد التلقائي)</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="AUTO"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">العنوان</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">المدينة</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">المنطقة</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">الدولة</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">الهاتف</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" className="flex-1">{submitLabel}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">المخازن</h2>
            <p className="text-muted-foreground">إدارة مخازن ومستودعات الشركة</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                إضافة مخزن
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء مخزن جديد</DialogTitle>
                <DialogDescription>إضافة مخزن جديد للمؤسسة</DialogDescription>
              </DialogHeader>
              <WarehouseForm onSubmit={handleSubmit} submitLabel="إنشاء المخزن" />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.id} className="p-4 hover:shadow-lg transition-smooth group">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Warehouse className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{warehouse.name}</h3>
                      <Badge
                        variant={warehouse.is_active ? "default" : "secondary"}
                        className="ml-auto cursor-pointer"
                        onClick={() => handleToggleActive(warehouse)}
                      >
                        {warehouse.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">الرمز: {warehouse.code}</p>
                    {warehouse.city && warehouse.state && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{warehouse.city}, {warehouse.state}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <PackageOpen className="h-3 w-3 text-muted-foreground" />
                      <span className={(stockCounts[warehouse.id] || 0) > 0 ? "text-primary font-medium" : "text-muted-foreground"}>
                        {stockCounts[warehouse.id] || 0} منتج في المخزن
                      </span>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleViewStock(warehouse)}
                      title="عرض المحتويات"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(warehouse)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedWarehouse(warehouse);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && warehouses.length === 0 && (
          <Card className="p-12 text-center">
            <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مخازن</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإنشاء أول مخزن</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              إضافة مخزن
            </Button>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المخزن</DialogTitle>
            <DialogDescription>تحديث بيانات المخزن</DialogDescription>
          </DialogHeader>
          <WarehouseForm onSubmit={handleUpdate} submitLabel="حفظ التغييرات" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم أرشفة المخزن "{selectedWarehouse?.name}" ولن يظهر في القوائم النشطة. يمكنك إعادة تفعيله لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Stock Dialog */}
      <Dialog open={!!viewingWarehouse} onOpenChange={(open) => !open && setViewingWarehouse(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>محتويات المخزن: {viewingWarehouse?.name}</DialogTitle>
            <DialogDescription>قائمة المنتجات والكميات المتوفرة في هذا المخزن</DialogDescription>
          </DialogHeader>

          {loadingStock ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {warehouseStock.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الرمز (SKU)</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseStock.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.product?.image_url && (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            {item.product?.name}
                          </div>
                        </TableCell>
                        <TableCell>{item.product?.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.location?.name}</Badge>
                        </TableCell>
                        <TableCell className="font-bold">{item.quantity}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveFromWarehouse(item.id, item.product?.name)}
                            title="إزالة من المخزن"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>المجموع الكلي</TableCell>
                      <TableCell colSpan={2}>
                        {warehouseStock.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد منتجات في هذا المخزن حالياً</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Warehouses;