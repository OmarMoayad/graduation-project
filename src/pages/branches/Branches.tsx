import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Users,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  name_ar: string | null;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  warehouse_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
}

const Branches = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    code: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    manager_id: "",
    warehouse_id: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, warehousesRes, employeesRes] = await Promise.all([
        supabase.from("branches").select("*").order("name"),
        supabase.from("warehouses").select("id, name, code").eq("is_active", true),
        supabase.from("profiles").select("id, full_name, position").eq("approval_status", "approved"),
      ]);

      if (branchesRes.error) throw branchesRes.error;
      if (warehousesRes.error) throw warehousesRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setBranches(branchesRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t("branches.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      code: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      manager_id: "",
      warehouse_id: "",
      is_active: true,
    });
    setEditingBranch(null);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      name_ar: branch.name_ar || "",
      code: branch.code,
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      email: branch.email || "",
      manager_id: branch.manager_id || "",
      warehouse_id: branch.warehouse_id || "",
      is_active: branch.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast.error(t("common.fillRequired"));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const branchData = {
        name: formData.name,
        name_ar: formData.name_ar || null,
        code: formData.code,
        address: formData.address || null,
        city: formData.city || null,
        phone: formData.phone || null,
        email: formData.email || null,
        manager_id: formData.manager_id || null,
        warehouse_id: formData.warehouse_id || null,
        is_active: formData.is_active,
        organization_id: profile?.organization_id,
      };

      if (editingBranch) {
        const { error } = await supabase
          .from("branches")
          .update(branchData)
          .eq("id", editingBranch.id);
        if (error) throw error;
        toast.success(t("branches.updateSuccess"));
      } else {
        const { error } = await supabase.from("branches").insert(branchData);
        if (error) throw error;
        toast.success(t("branches.createSuccess"));
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving branch:", error);
      toast.error(t("branches.saveFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;

    try {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("branches.deleteSuccess"));
      fetchData();
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error(t("branches.deleteFailed"));
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "-";
    const manager = employees.find((e) => e.id === managerId);
    return manager?.full_name || "-";
  };

  const getWarehouseName = (warehouseId: string | null) => {
    if (!warehouseId) return "-";
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse?.name || "-";
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {t("branches.title")}
            </h1>
            <p className="text-muted-foreground">{t("branches.subtitle")}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="me-2 h-4 w-4" />
                {t("branches.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBranch ? t("branches.edit") : t("branches.add")}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>{t("branches.name")} *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("branches.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.nameAr")}</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder={t("branches.nameArPlaceholder")}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.code")} *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BR-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.city")}</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t("branches.cityPlaceholder")}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>{t("branches.address")}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t("branches.addressPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.phone")}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+970..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.email")}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="branch@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.manager")}</Label>
                  <Select
                    value={formData.manager_id}
                    onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} {emp.position && `(${emp.position})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("branches.warehouse")}</Label>
                  <Select
                    value={formData.warehouse_id}
                    onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name} ({wh.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleSubmit}>
                  {editingBranch ? t("common.save") : t("common.create")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{branches.length}</p>
                  <p className="text-sm text-muted-foreground">{t("branches.totalBranches")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{branches.filter((b) => b.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">{t("branches.activeBranches")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{branches.filter((b) => b.manager_id).length}</p>
                  <p className="text-sm text-muted-foreground">{t("branches.withManagers")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>{t("branches.list")}</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("branches.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("branches.noBranches")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("branches.name")}</TableHead>
                      <TableHead>{t("branches.code")}</TableHead>
                      <TableHead>{t("branches.city")}</TableHead>
                      <TableHead>{t("branches.manager")}</TableHead>
                      <TableHead>{t("branches.warehouse")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBranches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{isRTL && branch.name_ar ? branch.name_ar : branch.name}</p>
                            {isRTL && branch.name_ar && (
                              <p className="text-xs text-muted-foreground">{branch.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{branch.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {branch.city || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{getManagerName(branch.manager_id)}</TableCell>
                        <TableCell>{getWarehouseName(branch.warehouse_id)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={branch.is_active ? "default" : "secondary"}
                            className={branch.is_active ? "bg-green-500" : ""}
                          >
                            {branch.is_active ? t("common.active") : t("common.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(branch)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(branch.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Branches;
