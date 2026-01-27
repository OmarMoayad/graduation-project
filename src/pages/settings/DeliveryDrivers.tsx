import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, UserCheck, X, Save, Car, Bike, Truck as TruckIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface DeliveryDriver {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  license_number: string | null;
  is_active: boolean;
  is_external: boolean;
  notes: string | null;
  company_id: string | null;
  user_id: string | null;
  created_at: string;
  delivery_companies?: {
    name: string;
  } | null;
}

interface DeliveryCompany {
  id: string;
  name: string;
}

const vehicleTypes = [
  { value: "motorcycle", label: "دراجة نارية", icon: Bike },
  { value: "car", label: "سيارة", icon: Car },
  { value: "van", label: "فان", icon: TruckIcon },
  { value: "truck", label: "شاحنة", icon: TruckIcon },
];

const DeliveryDrivers = () => {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    vehicle_type: "",
    vehicle_number: "",
    license_number: "",
    is_active: true,
    is_external: false,
    notes: "",
    company_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [driversRes, companiesRes] = await Promise.all([
        supabase
          .from("delivery_drivers")
          .select(`
            *,
            delivery_companies (name)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("delivery_companies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (driversRes.error) throw driversRes.error;
      if (companiesRes.error) throw companiesRes.error;

      setDrivers(driversRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      vehicle_type: "",
      vehicle_number: "",
      license_number: "",
      is_active: true,
      is_external: false,
      notes: "",
      company_id: "",
    });
    setEditingId(null);
  };

  const handleEdit = (driver: DeliveryDriver) => {
    setFormData({
      full_name: driver.full_name,
      phone: driver.phone || "",
      email: driver.email || "",
      vehicle_type: driver.vehicle_type || "",
      vehicle_number: driver.vehicle_number || "",
      license_number: driver.license_number || "",
      is_active: driver.is_active,
      is_external: driver.is_external,
      notes: driver.notes || "",
      company_id: driver.company_id || "",
    });
    setEditingId(driver.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السائق؟")) return;

    try {
      const { error } = await supabase
        .from("delivery_drivers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDrivers((prev) => prev.filter((d) => d.id !== id));
      toast.success("تم حذف السائق بنجاح");
    } catch (error) {
      console.error("Error deleting driver:", error);
      toast.error("فشل حذف السائق");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("اسم السائق مطلوب");
      return;
    }

    setSaving(true);

    try {
      // Get user's organization_id (optional - works without it for demo)
      const { data: { user } } = await supabase.auth.getUser();
      let organizationId: string | null = null;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        organizationId = profile?.organization_id || null;
      }

      const driverData = {
        full_name: formData.full_name.trim(),
        phone: formData.phone || null,
        email: formData.email || null,
        vehicle_type: formData.vehicle_type || null,
        vehicle_number: formData.vehicle_number || null,
        license_number: formData.license_number || null,
        is_active: formData.is_active,
        is_external: formData.is_external,
        notes: formData.notes || null,
        company_id: formData.company_id || null,
        organization_id: organizationId,
      };

      if (editingId) {
        const { error } = await supabase
          .from("delivery_drivers")
          .update(driverData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("تم تحديث بيانات السائق بنجاح");
      } else {
        const { error } = await supabase
          .from("delivery_drivers")
          .insert(driverData);

        if (error) throw error;
        toast.success("تم إضافة السائق بنجاح");
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Error saving driver:", error);
      toast.error(error.message || "فشل حفظ بيانات السائق");
    } finally {
      setSaving(false);
    }
  };

  const getVehicleIcon = (type: string | null) => {
    const vehicle = vehicleTypes.find((v) => v.value === type);
    if (!vehicle) return null;
    const Icon = vehicle.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getVehicleLabel = (type: string | null) => {
    const vehicle = vehicleTypes.find((v) => v.value === type);
    return vehicle?.label || type || "-";
  };

  return (
    <div dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            موظفي التوصيل
          </h2>
          <p className="text-muted-foreground">
            إدارة سائقي وموظفي التوصيل الداخليين والخارجيين
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة سائق
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة السائقين</CardTitle>
          <CardDescription>
            {drivers.length} سائق مسجل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا يوجد سائقين</p>
              <Button
                className="mt-4"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول سائق
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>السائق</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المركبة</TableHead>
                  <TableHead>الشركة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{driver.full_name}</p>
                        {driver.email && (
                          <p className="text-sm text-muted-foreground">
                            {driver.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{driver.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(driver.vehicle_type)}
                        <span>{getVehicleLabel(driver.vehicle_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.delivery_companies?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={driver.is_external ? "secondary" : "default"}>
                        {driver.is_external ? "خارجي" : "داخلي"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          driver.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {driver.is_active ? "نشط" : "غير نشط"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(driver)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(driver.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل بيانات السائق" : "إضافة سائق جديد"}
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات سائق التوصيل
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="أحمد محمد"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+970 59 123 4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="driver@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">نوع المركبة</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, vehicle_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_number">رقم المركبة</Label>
                <Input
                  id="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vehicle_number: e.target.value }))
                  }
                  placeholder="12-34567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_number">رقم الرخصة</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, license_number: e.target.value }))
                  }
                  placeholder="رقم رخصة القيادة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_id">شركة التوصيل</Label>
                <Select
                  value={formData.company_id || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, company_id: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشركة (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون شركة</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="ملاحظات إضافية..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">نشط</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_external"
                  checked={formData.is_external}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_external: checked }))
                  }
                />
                <Label htmlFor="is_external">سائق خارجي</Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryDrivers;