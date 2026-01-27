import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Truck, X, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeliveryCompany {
  id: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  tracking_url_template: string | null;
  is_active: boolean;
  created_at: string;
}

const DeliveryCompanies = () => {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
    tracking_url_template: "",
    is_active: true,
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("delivery_companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("فشل تحميل شركات التوصيل");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      phone: "",
      email: "",
      website: "",
      logo_url: "",
      tracking_url_template: "",
      is_active: true,
    });
    setEditingId(null);
  };

  const handleEdit = (company: DeliveryCompany) => {
    setFormData({
      name: company.name,
      name_ar: company.name_ar || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      logo_url: company.logo_url || "",
      tracking_url_template: company.tracking_url_template || "",
      is_active: company.is_active,
    });
    setEditingId(company.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشركة؟")) return;

    try {
      const { error } = await supabase
        .from("delivery_companies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      toast.success("تم حذف الشركة بنجاح");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("فشل حذف الشركة");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("اسم الشركة مطلوب");
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

      const companyData = {
        name: formData.name,
        name_ar: formData.name_ar || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        logo_url: formData.logo_url || null,
        tracking_url_template: formData.tracking_url_template || null,
        is_active: formData.is_active,
        organization_id: organizationId,
      };

      if (editingId) {
        const { error } = await supabase
          .from("delivery_companies")
          .update(companyData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("تم تحديث الشركة بنجاح");
      } else {
        const { error } = await supabase
          .from("delivery_companies")
          .insert(companyData);

        if (error) throw error;
        toast.success("تم إضافة الشركة بنجاح");
      }

      setDialogOpen(false);
      resetForm();
      loadCompanies();
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast.error(error.message || "فشل حفظ الشركة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            شركات التوصيل
          </h2>
          <p className="text-muted-foreground">
            إدارة شركات التوصيل لإيصال الطلبات للعملاء
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة شركة
        </Button>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة شركات التوصيل</CardTitle>
            <CardDescription>
              {companies.length} شركة مسجلة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد شركات توصيل</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    resetForm();
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول شركة
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشركة</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-10 h-10 rounded object-contain bg-muted"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Truck className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.name_ar && (
                              <p className="text-sm text-muted-foreground">
                                {company.name_ar}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{company.phone || "-"}</TableCell>
                      <TableCell>{company.email || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            company.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {company.is_active ? "نشطة" : "غير نشطة"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(company)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(company.id)}
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
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "تعديل شركة التوصيل" : "إضافة شركة توصيل"}
              </DialogTitle>
              <DialogDescription>
                أدخل بيانات شركة التوصيل
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الشركة (إنجليزي) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="DHL Express"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">اسم الشركة (عربي)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name_ar: e.target.value }))
                    }
                    placeholder="دي إتش إل"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+970 2 123 4567"
                  />
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
                    placeholder="info@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">الموقع الإلكتروني</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://www.company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">رابط الشعار</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, logo_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_url_template">رابط تتبع الشحنات</Label>
                <Input
                  id="tracking_url_template"
                  value={formData.tracking_url_template}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tracking_url_template: e.target.value,
                    }))
                  }
                  placeholder="https://track.company.com/{tracking_number}"
                />
                <p className="text-xs text-muted-foreground">
                  استخدم {"{tracking_number}"} كعنصر نائب لرقم التتبع
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">شركة نشطة</Label>
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

export default DeliveryCompanies;