import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddPricelistItemDialog from "@/components/purchases/AddPricelistItemDialog";

interface VendorPricelistItem {
  id: string;
  vendor: { name: string };
  product: { name: string; sku: string };
  unit_price: number;
  min_quantity: number;
  currency: string;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
}

const VendorPricelist = () => {
  const [pricelistItems, setPricelistItems] = useState<VendorPricelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPricelist();
  }, []);

  const fetchPricelist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from("vendor_pricelists")
        .select(`
          id,
          unit_price,
          min_quantity,
          currency,
          valid_from,
          valid_to,
          is_active,
          vendor:contacts!vendor_id(name),
          product:products!product_id(name, sku)
        `)
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("vendor_id");

      if (error) throw error;
      setPricelistItems(data as any || []);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vendor Pricelists</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pricelist Item
        </Button>
      </div>

      <AddPricelistItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchPricelist}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Vendor Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : pricelistItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vendor prices configured yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Min Qty</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Valid To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricelistItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.vendor.name}
                    </TableCell>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.product.sku}</TableCell>
                    <TableCell>
                      {item.currency} {item.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell>{item.min_quantity}</TableCell>
                    <TableCell>
                      {item.valid_from
                        ? new Date(item.valid_from).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {item.valid_to
                        ? new Date(item.valid_to).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorPricelist;
