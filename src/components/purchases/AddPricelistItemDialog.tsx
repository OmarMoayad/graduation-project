import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface AddPricelistItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddPricelistItemDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: AddPricelistItemDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    vendor_id: "",
    product_id: "",
    unit_price: "",
    min_quantity: "1",
    currency: "USD",
    valid_from: "",
    valid_to: "",
  });

  useEffect(() => {
    if (open) {
      fetchVendorsAndProducts();
    }
  }, [open]);

  const fetchVendorsAndProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      // Fetch vendors (contacts that are vendors)
      const { data: vendorsData } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("organization_id", profile.organization_id)
        .eq("is_vendor", true)
        .eq("is_active", true)
        .order("name");

      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("name");

      setVendors(vendorsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.vendor_id || !formData.product_id || !formData.unit_price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      const { error } = await supabase.from("vendor_pricelists").insert({
        organization_id: profile.organization_id,
        vendor_id: formData.vendor_id,
        product_id: formData.product_id,
        unit_price: parseFloat(formData.unit_price),
        min_quantity: parseInt(formData.min_quantity) || 1,
        currency: formData.currency,
        valid_from: formData.valid_from || null,
        valid_to: formData.valid_to || null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricelist item added successfully",
      });

      // Reset form
      setFormData({
        vendor_id: "",
        product_id: "",
        unit_price: "",
        min_quantity: "1",
        currency: "USD",
        valid_from: "",
        valid_to: "",
      });

      onSuccess();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Pricelist Item</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
            <Label htmlFor="product">Product *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) =>
                setFormData({ ...formData, product_id: value })
              }
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({ ...formData, unit_price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ILS">ILS</SelectItem>
                  <SelectItem value="JOD">JOD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_quantity">Minimum Quantity</Label>
            <Input
              id="min_quantity"
              type="number"
              value={formData.min_quantity}
              onChange={(e) =>
                setFormData({ ...formData, min_quantity: e.target.value })
              }
              placeholder="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_from">Valid From</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_to">Valid To</Label>
              <Input
                id="valid_to"
                type="date"
                value={formData.valid_to}
                onChange={(e) =>
                  setFormData({ ...formData, valid_to: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPricelistItemDialog;
