import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Cloud, X, Upload, Warehouse, Store } from "lucide-react";

interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  location_id: string | null;
  quantity: number;
  selected: boolean;
}

interface BranchStock {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  quantity: number;
  selected: boolean;
  section?: string; // قسم المنتج في الفرع مثل: قسم الخضراوات، الرف الثالث
  shelf?: string;
}

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organizationId, setOrganizationId] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [qtyOnHand, setQtyOnHand] = useState<number>(0);
  const [manualQtyChange, setManualQtyChange] = useState<boolean>(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [avgCost, setAvgCost] = useState<number>(0);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [branchStocks, setBranchStocks] = useState<BranchStock[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category_id: "",
    product_type: "storable",
    uom: "unit",
    sales_price: "0",
    image_url: "",
    location_x: "",
    location_y: "",
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadCategories();
      loadWarehouses();
      loadBranches();
      if (isEdit) {
        loadProduct();
        loadQtyOnHand();
        loadPriceHistory();
        loadAvgCost();
        loadWarehouseStock();
        loadBranchStock();
      }
    }
  }, [organizationId, isEdit]);

  const loadOrganization = async () => {
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

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
    }
  };

  const loadProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load product");
      navigate("/inventory");
    } else if (data) {
      setFormData({
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || "",
        description: data.description || "",
        category_id: data.category_id || "",
        product_type: data.product_type,
        uom: data.uom,
        sales_price: data.sales_price.toString(),
        image_url: data.image_url || "",
        location_x: data.location_x?.toString() || "",
        location_y: data.location_y?.toString() || "",
      });
      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    setCategories(data || []);
  };

  const loadQtyOnHand = async () => {
    if (!id) return;

    // Fetch warehouse stock
    const { data: quants } = await supabase
      .from("stock_quants")
      .select("quantity")
      .eq("product_id", id)
      .eq("organization_id", organizationId);

    // Fetch branch stock
    const { data: branchStocks } = await supabase
      .from("branch_stock")
      .select("quantity")
      .eq("product_id", id)
      .eq("organization_id", organizationId);

    const warehouseTotal = quants?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
    const branchTotal = branchStocks?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

    setQtyOnHand(warehouseTotal + branchTotal);
  };

  const loadPriceHistory = async () => {
    if (!id) return;

    const { data } = await supabase
      .from("purchase_order_lines")
      .select(`
        id,
        unit_price,
        purchase_order:purchase_orders(
          order_number,
          order_date,
          vendor:contacts(name)
        )
      `)
      .eq("product_id", id)
      .order("purchase_order(order_date)", { ascending: false });

    if (data) {
      const history = data
        .filter(line => line.purchase_order)
        .map(line => ({
          id: line.id,
          unit_price: line.unit_price,
          order_number: (line.purchase_order as any).order_number,
          order_date: (line.purchase_order as any).order_date,
          vendor: (line.purchase_order as any).vendor
        }));
      setPriceHistory(history);
    }
  };

  const loadAvgCost = async () => {
    if (!id) return;

    const { data } = await supabase
      .from("purchase_order_lines")
      .select("unit_price, quantity")
      .eq("product_id", id);

    if (data && data.length > 0) {
      const totalCost = data.reduce((sum, line) => sum + (Number(line.unit_price) * Number(line.quantity)), 0);
      const totalQty = data.reduce((sum, line) => sum + Number(line.quantity), 0);
      setAvgCost(totalQty > 0 ? totalCost / totalQty : 0);
    }
  };

  const loadWarehouses = async () => {
    const { data: warehouses } = await supabase
      .from("warehouses")
      .select("id, name, code")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (warehouses) {
      // Get default location for each warehouse
      const warehouseData: WarehouseStock[] = [];
      for (const wh of warehouses) {
        // Try to find a location named 'Stock' first, otherwise fallback to any internal location
        let { data: location } = await supabase
          .from("locations")
          .select("id")
          .eq("warehouse_id", wh.id)
          .eq("name", "Stock")
          .eq("is_active", true)
          .maybeSingle();

        if (!location) {
          const { data: fallback } = await supabase
            .from("locations")
            .select("id")
            .eq("warehouse_id", wh.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();
          location = fallback;
        }

        warehouseData.push({
          warehouse_id: wh.id,
          warehouse_name: wh.name,
          warehouse_code: wh.code,
          location_id: location?.id || null,
          quantity: 0,
          selected: false,
        });
      }
      setWarehouseStocks(warehouseData);
    }
  };

  const loadWarehouseStock = async () => {
    if (!id) return;

    // Get stock quants for this product with warehouse info
    const { data: quants } = await supabase
      .from("stock_quants")
      .select(`
        quantity, 
        location_id,
        location:locations(warehouse_id)
      `)
      .eq("product_id", id)
      .eq("organization_id", organizationId);

    if (quants) {
      setWarehouseStocks(prev => {
        return prev.map(ws => {
          // Sum all stock for this warehouse (across all its locations)
          // This accounts for stock that might be in Main, Shelf A, Shelf B, etc.
          const totalForWarehouse = quants
            .filter(q => (q.location as any)?.warehouse_id === ws.warehouse_id)
            .reduce((sum, q) => sum + (Number(q.quantity) || 0), 0);

          return {
            ...ws,
            quantity: totalForWarehouse,
            selected: totalForWarehouse > 0,
          };
        });
      });
    }
  };

  const loadBranches = async () => {
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name, name_ar, code, warehouse_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (branches) {
      const branchData: BranchStock[] = [];
      for (const branch of branches) {
        branchData.push({
          branch_id: branch.id,
          branch_name: branch.name_ar || branch.name,
          branch_code: branch.code,
          quantity: 0,
          selected: false,
          section: "",
        });
      }
      setBranchStocks(branchData);
    }
  };

  const loadBranchStock = async () => {
    if (!id) return;

    // Load branch stock from the new branch_stock table
    const { data: branchStockData } = await supabase
      .from("branch_stock")
      .select("branch_id, quantity, section, shelf")
      .eq("product_id", id)
      .eq("organization_id", organizationId);

    if (branchStockData) {
      setBranchStocks(prev => {
        return prev.map(bs => {
          const stockRecord = branchStockData.find(s => s.branch_id === bs.branch_id);
          if (stockRecord) {
            return {
              ...bs,
              quantity: Number(stockRecord.quantity) || 0,
              selected: true,
              section: stockRecord.section || stockRecord.shelf || "",
            };
          }
          return bs;
        });
      });
    }
  };

  const handleWarehouseToggle = (warehouseId: string, selected: boolean) => {
    setWarehouseStocks(prev =>
      prev.map(ws =>
        ws.warehouse_id === warehouseId
          ? { ...ws, selected, quantity: selected ? ws.quantity : 0 }
          : ws
      )
    );
  };

  const handleWarehouseQuantityChange = (warehouseId: string, quantity: number) => {
    setWarehouseStocks(prev =>
      prev.map(ws =>
        ws.warehouse_id === warehouseId
          ? { ...ws, quantity, selected: quantity > 0 ? true : ws.selected }
          : ws
      )
    );
  };

  const getTotalStock = () => {
    return warehouseStocks
      .filter(ws => ws.selected)
      .reduce((sum, ws) => sum + ws.quantity, 0);
  };

  const handleBranchToggle = (branchId: string, selected: boolean) => {
    setBranchStocks(prev =>
      prev.map(bs =>
        bs.branch_id === branchId
          ? { ...bs, selected, quantity: selected ? bs.quantity : 0 }
          : bs
      )
    );
  };

  const handleBranchQuantityChange = (branchId: string, quantity: number) => {
    setBranchStocks(prev =>
      prev.map(bs =>
        bs.branch_id === branchId
          ? { ...bs, quantity, selected: quantity > 0 ? true : bs.selected }
          : bs
      )
    );
  };

  const handleBranchSectionChange = (branchId: string, section: string) => {
    setBranchStocks(prev =>
      prev.map(bs =>
        bs.branch_id === branchId
          ? { ...bs, section }
          : bs
      )
    );
  };

  const getTotalBranchStock = () => {
    return branchStocks
      .filter(bs => bs.selected)
      .reduce((sum, bs) => sum + bs.quantity, 0);
  }

  const handleTotalQtyChange = (newTotal: number) => {
    setQtyOnHand(newTotal);
    setManualQtyChange(true);

    // Auto-distribute to first selected warehouse or first available
    setWarehouseStocks(prev => {
      const active = prev.filter(ws => ws.selected);
      if (active.length > 0) {
        // Option 1: Add difference to the first warehouse
        // Option 2: Reset all and put everything in first?
        // Let's go with Option 2 for simplicity when editing total directly
        const first = active[0];
        return prev.map(ws =>
          ws.warehouse_id === first.warehouse_id
            ? { ...ws, quantity: newTotal }
            : { ...ws, quantity: 0 } // Reset others if total is manually overridden
        );
      } else if (prev.length > 0) {
        // No warehouse selected, select the first one
        const first = prev[0];
        return prev.map(ws =>
          ws.warehouse_id === first.warehouse_id
            ? { ...ws, quantity: newTotal, selected: true }
            : ws
        );
      }
      return prev;
    });
  };

  const generateSKU = () => {
    const prefix = "PRD";
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}-${random}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${organizationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      toast.error("Failed to upload image");
      return null;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const imageUrl = await uploadImage();

    const productData = {
      organization_id: organizationId,
      name: formData.name,
      sku: formData.sku || generateSKU(),
      barcode: formData.barcode || null,
      description: formData.description || null,
      category_id: formData.category_id || null,
      product_type: formData.product_type as any,
      uom: formData.uom as any,
      sales_price: parseFloat(formData.sales_price),
      cost_price: 0,
      image_url: imageUrl,
      created_by: user.id,
      location_x: formData.location_x ? parseFloat(formData.location_x) : null,
      location_y: formData.location_y ? parseFloat(formData.location_y) : null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", id);

      if (error) {
        toast.error("Failed to update product");
        return;
      }

      // Update stock quants for selected warehouses
      await updateWarehouseStock(id as string, user.id);
      // Update branch stock
      await updateBranchStock(id as string);
      toast.success("Product updated successfully");
      navigate("/inventory");
    } else {
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert(productData as any)
        .select("id")
        .single();

      if (error) {
        toast.error("Failed to create product");
        return;
      }

      // Create stock quants for selected warehouses
      await updateWarehouseStock(newProduct.id, user.id);
      // Create branch stock
      await updateBranchStock(newProduct.id);
      toast.success("Product created successfully");
      navigate("/inventory");
    }
  };

  const updateWarehouseStock = async (productId: string, userId: string) => {
    // Filter selected warehouses (removed location_id check to handle missing locations)
    const selectedWarehouses = warehouseStocks.filter(ws => ws.selected);

    for (const ws of selectedWarehouses) {
      let locationId = ws.location_id;

      // If no location exists for this warehouse, create a default one
      if (!locationId) {
        try {
          const { data: newLoc, error: locError } = await supabase
            .from("locations")
            .insert({
              organization_id: organizationId,
              warehouse_id: ws.warehouse_id,
              name: "Stock",
              location_type: "internal",
              is_active: true
            } as any)
            .select("id")
            .single();

          if (locError) throw locError;
          if (newLoc) locationId = newLoc.id;
        } catch (error) {
          console.error("Error creating default location:", error);
          toast.error(`Could not create storage location for warehouse ${ws.warehouse_name}`);
          continue;
        }
      }

      if (!locationId) continue;

      // 1. First, find ALL stock quants for this product in this warehouse
      const { data: allWarehouseQuants } = await supabase
        .from("stock_quants")
        .select("id, quantity, location_id, location!inner(warehouse_id)")
        .eq("product_id", productId)
        .eq("location.warehouse_id", ws.warehouse_id);

      // 2. Identify the target quant (the one we are updating)
      const targetQuant = allWarehouseQuants?.find(q => q.location_id === locationId);

      // 3. Handle the target quant
      if (targetQuant) {
        if (Number(targetQuant.quantity) !== ws.quantity) {
          const diff = ws.quantity - Number(targetQuant.quantity);
          await supabase
            .from("stock_quants")
            .update({ quantity: ws.quantity })
            .eq("id", targetQuant.id);

          // Create stock move
          if (diff !== 0) {
            await supabase.from("stock_moves").insert({
              organization_id: organizationId,
              product_id: productId,
              destination_location_id: locationId,
              quantity: Math.abs(diff),
              move_type: "adjustment",
              notes: diff > 0 ? "تسوية مخزون - تعديل يدوي" : "تسوية مخزون - تعديل يدوي",
              created_by: userId,
            });
          }
        }
      } else {
        // Create new
        await supabase.from("stock_quants").insert({
          organization_id: organizationId,
          product_id: productId,
          location_id: locationId,
          quantity: ws.quantity,
        });

        if (ws.quantity > 0) {
          await supabase.from("stock_moves").insert({
            organization_id: organizationId,
            product_id: productId,
            destination_location_id: locationId,
            quantity: ws.quantity,
            move_type: "adjustment",
            notes: "مخزون ابتدائي",
            created_by: userId,
          });
        }
      }

      // 4. CLEANUP: Zero out any OTHER quants in this same warehouse to avoid "1100" bug
      // This now correctly catches duplicates EVEN IF they have the same location_id
      if (allWarehouseQuants) {
        // Exclude the ID of the quant we just created or updated
        const activeId = targetQuant ? targetQuant.id : (await supabase.from("stock_quants").select("id").eq("location_id", locationId).eq("product_id", productId).order('created_at', { ascending: false }).limit(1).maybeSingle())?.data?.id;

        const otherQuants = allWarehouseQuants.filter(q => q.id !== activeId && Number(q.quantity) > 0);

        for (const other of otherQuants) {
          await supabase
            .from("stock_quants")
            .update({ quantity: 0 })
            .eq("id", other.id);

          // Log the removal
          await supabase.from("stock_moves").insert({
            organization_id: organizationId,
            product_id: productId,
            destination_location_id: other.location_id,
            quantity: Number(other.quantity),
            move_type: "adjustment",
            notes: "تسوية مخزون - دمج تلقائي",
            created_by: userId,
          });
        }
      }
    }
  };

  const updateBranchStock = async (productId: string) => {
    const selectedBranches = branchStocks.filter(bs => bs.selected);

    for (const bs of selectedBranches) {
      // Check if branch stock exists
      const { data: existing } = await supabase
        .from("branch_stock")
        .select("id, quantity")
        .eq("product_id", productId)
        .eq("branch_id", bs.branch_id)
        .maybeSingle();

      if (existing) {
        // Update existing branch stock
        await supabase
          .from("branch_stock")
          .update({
            quantity: bs.quantity,
            section: bs.section || null,
            shelf: bs.shelf || null,
          })
          .eq("id", existing.id);
      } else if (bs.quantity > 0) {
        // Create new branch stock
        await supabase.from("branch_stock").insert({
          organization_id: organizationId,
          product_id: productId,
          branch_id: bs.branch_id,
          quantity: bs.quantity,
          section: bs.section || null,
          shelf: bs.shelf || null,
        });
      }
    }

    // Delete branch stocks for unselected branches
    const unselectedBranches = branchStocks.filter(bs => !bs.selected);
    for (const bs of unselectedBranches) {
      await supabase
        .from("branch_stock")
        .delete()
        .eq("product_id", productId)
        .eq("branch_id", bs.branch_id);
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {isEdit ? formData.name || "Product" : "New"}
            </h1>
            {isEdit && formData.sku && (
              <span className="text-sm text-muted-foreground">[{formData.sku}]</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/inventory")}
              title="Discard"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              onClick={handleSubmit}
              title="Save"
            >
              <Cloud className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="flex h-full">
            {/* Main Form */}
            <div className="flex-1 p-6">
              <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                {/* Product Name */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Label htmlFor="name" className="w-48 text-sm font-normal">
                    Product Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Product Name"
                    required
                    className="flex-1 border-0 border-b rounded-none px-0 focus-visible:ring-0"
                  />
                </div>

                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger value="general" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      General Information
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      Inventory
                    </TabsTrigger>
                    <TabsTrigger value="purchase" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      Purchase
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 mt-6">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="product_type" className="w-48 text-sm font-normal">
                        Product Type
                      </Label>
                      <Select
                        value={formData.product_type}
                        onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="storable">Storable Product</SelectItem>
                          <SelectItem value="consumable">Consumable</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="category" className="w-48 text-sm font-normal">
                        Product Category
                      </Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="sku" className="w-48 text-sm font-normal">
                        Internal Reference
                      </Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Auto-generated if empty"
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="barcode" className="w-48 text-sm font-normal">
                        Barcode
                      </Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="uom" className="w-48 text-sm font-normal">
                        Unit of Measure
                      </Label>
                      <Select
                        value={formData.uom}
                        onValueChange={(value) => setFormData({ ...formData, uom: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit">Units</SelectItem>
                          <SelectItem value="kg">Kilogram</SelectItem>
                          <SelectItem value="g">Gram</SelectItem>
                          <SelectItem value="lbs">Pounds</SelectItem>
                          <SelectItem value="liter">Liter</SelectItem>
                          <SelectItem value="dozen">Dozen</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isEdit && (
                      <div className="flex items-center gap-4">
                        <Label className="w-48 text-sm font-normal">
                          Qty on Hand
                        </Label>
                        <Input
                          value={qtyOnHand}
                          onChange={(e) => handleTotalQtyChange(Number(e.target.value) || 0)}
                          className="flex-1"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Label htmlFor="sales_price" className="w-48 text-sm font-normal">
                        Sales Price
                      </Label>
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          id="sales_price"
                          type="number"
                          step="0.01"
                          value={formData.sales_price}
                          onChange={(e) => setFormData({ ...formData, sales_price: e.target.value })}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">₪</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="location_x" className="w-48 text-sm font-normal">
                        Floor Plan X (%)
                      </Label>
                      <Input
                        id="location_x"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={formData.location_x}
                        onChange={(e) => setFormData({ ...formData, location_x: e.target.value })}
                        placeholder="0-100"
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor="location_y" className="w-48 text-sm font-normal">
                        Floor Plan Y (%)
                      </Label>
                      <Input
                        id="location_y"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={formData.location_y}
                        onChange={(e) => setFormData({ ...formData, location_y: e.target.value })}
                        placeholder="0-100"
                        className="flex-1"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="inventory" className="space-y-6 mt-6">
                    {/* قسم المخازن */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Warehouse className="h-4 w-4" />
                            المخازن (لتخزين البضاعة)
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            اختر المخازن التي يتوفر فيها هذا المنتج وحدد الكمية لكل مخزن
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          إجمالي المخزون: <span className="text-primary">{getTotalStock()}</span>
                        </div>
                      </div>

                      {warehouseStocks.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border rounded-md">
                          لا توجد مخازن. يرجى إضافة مخازن أولاً.
                        </div>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">متوفر</TableHead>
                                <TableHead>المخزن</TableHead>
                                <TableHead>الرمز</TableHead>
                                <TableHead className="w-32">الكمية</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {warehouseStocks.map((ws) => (
                                <TableRow key={ws.warehouse_id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={ws.selected}
                                      onCheckedChange={(checked) =>
                                        handleWarehouseToggle(ws.warehouse_id, checked as boolean)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">{ws.warehouse_name}</TableCell>
                                  <TableCell className="text-muted-foreground">{ws.warehouse_code}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={ws.quantity}
                                      onChange={(e) =>
                                        handleWarehouseQuantityChange(ws.warehouse_id, Number(e.target.value) || 0)
                                      }
                                      disabled={!ws.selected}
                                      className="w-24"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    {/* قسم الفروع */}
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            الفروع (مكان عرض المنتجات للزبون)
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            حدد الفروع التي يتوفر فيها هذا المنتج ومكان تواجده (القسم/الرف)
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          إجمالي في الفروع: <span className="text-primary">{getTotalBranchStock()}</span>
                        </div>
                      </div>

                      {branchStocks.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border rounded-md">
                          لا توجد فروع. يرجى إضافة فروع أولاً.
                        </div>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">متوفر</TableHead>
                                <TableHead>الفرع</TableHead>
                                <TableHead>القسم / الرف</TableHead>
                                <TableHead className="w-32">الكمية</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {branchStocks.map((bs) => (
                                <TableRow key={bs.branch_id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={bs.selected}
                                      onCheckedChange={(checked) =>
                                        handleBranchToggle(bs.branch_id, checked as boolean)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">{bs.branch_name}</TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="مثال: قسم الخضراوات، الرف الثالث"
                                      value={bs.section || ""}
                                      onChange={(e) =>
                                        handleBranchSectionChange(bs.branch_id, e.target.value)
                                      }
                                      disabled={!bs.selected}
                                      className="min-w-[200px]"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={bs.quantity}
                                      onChange={(e) =>
                                        handleBranchQuantityChange(bs.branch_id, Number(e.target.value) || 0)
                                      }
                                      disabled={!bs.selected}
                                      className="w-24"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    {isEdit && (
                      <div className="bg-muted/50 rounded-md p-4 space-y-2">
                        <p className="text-sm font-medium">ملاحظة:</p>
                        <p className="text-xs text-muted-foreground">
                          الكميات المعروضة هي الكميات الحالية من سجلات المخزون. تعديل الكميات هنا سيؤدي إلى تسوية المخزون.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="purchase" className="space-y-4 mt-6">
                    {isEdit && avgCost > 0 && (
                      <div className="flex items-center gap-4">
                        <Label className="w-48 text-sm font-normal">
                          Average Cost
                        </Label>
                        <Input
                          value={`₪${avgCost.toFixed(2)}`}
                          readOnly
                          className="flex-1 bg-muted"
                        />
                      </div>
                    )}

                    {isEdit && priceHistory.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Purchase Price History</Label>
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Purchase Order</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {priceHistory.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.vendor?.name || "-"}</TableCell>
                                  <TableCell>₪{Number(item.unit_price).toFixed(2)}</TableCell>
                                  <TableCell>
                                    {new Date(item.order_date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>{item.order_number}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </form>
            </div>

            {/* Sidebar - Image */}
            <div className="w-64 border-l bg-muted/20 p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Image</h3>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product"
                      className="w-full aspect-square object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setFormData({ ...formData, image_url: "" });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full aspect-square border-2 border-dashed rounded flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">No image</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductForm;