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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, MapPin, Loader2, Pencil, Building2, Package } from "lucide-react";

interface Location {
  id: string;
  name: string;
  code: string | null;
  location_type: string;
  aisle: string | null;
  rack: string | null;
  shelf: string | null;
  is_active: boolean;
  warehouse_id: string;
  warehouse?: { name: string; code: string } | null;
  branch?: { name: string; name_ar: string | null } | null;
  stock_count?: number;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Branch {
  id: string;
  name: string;
  name_ar: string | null;
  warehouse_id: string | null;
}

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    warehouse_id: "",
    location_type: "internal",
    aisle: "",
    rack: "",
    shelf: ""
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadLocations();
      loadWarehouses();
      loadBranches();
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

  const loadLocations = async () => {
    setLoading(true);
    // Load locations with warehouse info
    const { data: locationsData, error } = await supabase
      .from("locations")
      .select(`
        *,
        warehouse:warehouses(name, code)
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load locations");
      setLoading(false);
      return;
    }

    // Load stock counts per location
    const { data: stockData } = await supabase
      .from("stock_quants")
      .select("location_id, quantity")
      .eq("organization_id", organizationId);

    // Load branches to map warehouses to branches
    const { data: branchesData } = await supabase
      .from("branches")
      .select("id, name, name_ar, warehouse_id")
      .eq("organization_id", organizationId);

    // Create warehouse to branch map
    const warehouseBranchMap = new Map<string, Branch>();
    branchesData?.forEach(b => {
      if (b.warehouse_id) {
        warehouseBranchMap.set(b.warehouse_id, b);
      }
    });

    // Calculate stock per location
    const stockByLocation = new Map<string, number>();
    stockData?.forEach(sq => {
      if (sq.location_id) {
        stockByLocation.set(
          sq.location_id,
          (stockByLocation.get(sq.location_id) || 0) + Number(sq.quantity)
        );
      }
    });

    // Enrich locations with branch and stock info
    const enrichedLocations = (locationsData || []).map(loc => ({
      ...loc,
      branch: loc.warehouse_id ? warehouseBranchMap.get(loc.warehouse_id) : null,
      stock_count: stockByLocation.get(loc.id) || 0,
    }));

    setLocations(enrichedLocations);
    setLoading(false);
  };

  const loadWarehouses = async () => {
    const { data } = await supabase
      .from("warehouses")
      .select("id, name, code")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    setWarehouses(data || []);
  };

  const loadBranches = async () => {
    const { data } = await supabase
      .from("branches")
      .select("id, name, name_ar, warehouse_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    setBranches(data || []);
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code || "",
      warehouse_id: location.warehouse_id,
      location_type: location.location_type,
      aisle: location.aisle || "",
      rack: location.rack || "",
      shelf: location.shelf || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLocation(null);
    setFormData({
      name: "",
      code: "",
      warehouse_id: "",
      location_type: "internal",
      aisle: "",
      rack: "",
      shelf: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.warehouse_id) {
      toast.error("الرجاء اختيار المخزن");
      return;
    }

    const locationData = {
      organization_id: organizationId,
      warehouse_id: formData.warehouse_id,
      name: formData.name,
      code: formData.code || null,
      location_type: formData.location_type as any,
      aisle: formData.aisle || null,
      rack: formData.rack || null,
      shelf: formData.shelf || null
    };

    if (editingLocation) {
      // Update existing location
      const { error } = await supabase
        .from("locations")
        .update(locationData)
        .eq("id", editingLocation.id);

      if (error) {
        toast.error(error.message || "فشل تحديث الموقع");
      } else {
        toast.success("تم تحديث الموقع بنجاح");
        setIsDialogOpen(false);
        resetForm();
        loadLocations();
      }
    } else {
      // Create new location
      const { error } = await supabase.from("locations").insert(locationData as any);

      if (error) {
        toast.error(error.message || "فشل إنشاء الموقع");
      } else {
        toast.success("تم إنشاء الموقع بنجاح");
        setIsDialogOpen(false);
        resetForm();
        loadLocations();
      }
    }
  };

  const getLocationTypeBadgeColor = (type: string) => {
    switch (type) {
      case "internal": return "default";
      case "view": return "secondary";
      case "customer": return "outline";
      case "vendor": return "outline";
      case "transit": return "outline";
      default: return "default";
    }
  };

  const getBranchForWarehouse = (warehouseId: string) => {
    return branches.find(b => b.warehouse_id === warehouseId);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">المواقع</h2>
            <p className="text-muted-foreground">إدارة مواقع التخزين داخل المخازن والفروع</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                إضافة موقع
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? "تعديل الموقع" : "إنشاء موقع جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation ? "تعديل بيانات الموقع" : "إضافة موقع تخزين جديد"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouse">المخزن *</Label>
                  <Select
                    value={formData.warehouse_id}
                    onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => {
                        const branch = getBranchForWarehouse(wh.id);
                        return (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} {branch ? `(${branch.name_ar || branch.name})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الموقع *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="مثال: قسم الخضراوات"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">الرمز</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="VEG-01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_type">نوع الموقع</Label>
                  <Select
                    value={formData.location_type}
                    onValueChange={(value) => setFormData({ ...formData, location_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">داخلي</SelectItem>
                      <SelectItem value="view">عرض (رئيسي)</SelectItem>
                      <SelectItem value="customer">عميل</SelectItem>
                      <SelectItem value="vendor">مورد</SelectItem>
                      <SelectItem value="transit">نقل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aisle">الممر</Label>
                    <Input
                      id="aisle"
                      value={formData.aisle}
                      onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                      placeholder="A1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rack">الرف</Label>
                    <Input
                      id="rack"
                      value={formData.rack}
                      onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                      placeholder="R2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shelf">الطبقة</Label>
                    <Input
                      id="shelf"
                      value={formData.shelf}
                      onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                      placeholder="S3"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    {editingLocation ? "حفظ التعديلات" : "إنشاء الموقع"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
            <Card 
              key={location.id} 
              className="p-4 hover:shadow-lg transition-smooth cursor-pointer group"
              onClick={() => openEditDialog(location)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{location.name}</h3>
                    <Badge variant={getLocationTypeBadgeColor(location.location_type)} className="ml-auto text-xs">
                      {location.location_type === 'internal' ? 'داخلي' : location.location_type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(location);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Branch & Warehouse Info */}
                  {location.branch && (
                    <div className="flex items-center gap-1 text-sm text-primary mb-1">
                      <Building2 className="h-3 w-3" />
                      <span>{location.branch.name_ar || location.branch.name}</span>
                    </div>
                  )}
                  
                  {location.warehouse && (
                    <p className="text-sm text-muted-foreground">
                      المخزن: {location.warehouse.name}
                    </p>
                  )}
                  
                  {location.code && (
                    <p className="text-sm text-muted-foreground">الرمز: {location.code}</p>
                  )}
                  
                  {(location.aisle || location.rack || location.shelf) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {[location.aisle, location.rack, location.shelf].filter(Boolean).join(" / ")}
                    </p>
                  )}

                  {/* Stock Count */}
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className={location.stock_count && location.stock_count > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {location.stock_count || 0} وحدة في المخزون
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          </div>
        )}

        {!loading && locations.length === 0 && (
          <Card className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مواقع</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإنشاء أول موقع تخزين</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-primary" disabled={warehouses.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              إضافة موقع
            </Button>
            {warehouses.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">تحتاج إلى إنشاء مخزن أولاً</p>
            )}
          </Card>
        )}
      </div>
    </>
  );
};

export default Locations;
