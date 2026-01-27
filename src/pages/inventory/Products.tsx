import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Package, Search, Star, LayoutGrid, List, Loader2, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sales_price: number;
  cost_price: number;
  product_type: string;
  uom: string;
  is_active: boolean;
  image_url: string | null;
}

interface StockQuant {
  quantity: number;
}

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});
  const [avgCosts, setAvgCosts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadProducts();
      loadStockQuantities();
      loadAvgCosts();
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

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
      // Check for and resolve duplicates
      if (data && data.length > 0) {
        resolveProductDuplicates(data);
      }
    }
    setLoading(false);
  };

  const loadStockQuantities = async () => {
    // 1. Fetch warehouse stock (stock_quants)
    const { data: quants } = await supabase
      .from("stock_quants")
      .select("product_id, quantity")
      .eq("organization_id", organizationId);

    // 2. Fetch branch stock (branch_stock)
    const { data: branchStocks } = await supabase
      .from("branch_stock")
      .select("product_id, quantity")
      .eq("organization_id", organizationId);

    const quantities: Record<string, number> = {};

    if (quants) {
      quants.forEach((quant) => {
        quantities[quant.product_id] = (quantities[quant.product_id] || 0) + quant.quantity;
      });
    }

    if (branchStocks) {
      branchStocks.forEach((stock) => {
        quantities[stock.product_id] = (quantities[stock.product_id] || 0) + stock.quantity;
      });
    }

    setStockQuantities(quantities);
  };

  const loadAvgCosts = async () => {
    const { data } = await supabase
      .from("purchase_order_lines")
      .select("product_id, unit_price");

    if (data) {
      const costs: Record<string, { total: number; count: number }> = {};
      data.forEach((line) => {
        if (!costs[line.product_id]) {
          costs[line.product_id] = { total: 0, count: 0 };
        }
        costs[line.product_id].total += line.unit_price;
        costs[line.product_id].count += 1;
      });

      const avgCosts: Record<string, number> = {};
      Object.keys(costs).forEach((productId) => {
        avgCosts[productId] = costs[productId].total / costs[productId].count;
      });
      setAvgCosts(avgCosts);
    }
  };

  const resolveProductDuplicates = async (allProducts: Product[]) => {
    // Group by SKU
    const bySku: Record<string, Product[]> = {};
    allProducts.forEach(p => {
      if (p.sku) {
        if (!bySku[p.sku]) bySku[p.sku] = [];
        bySku[p.sku].push(p);
      }
    });

    let fixedCount = 0;

    for (const sku in bySku) {
      const group = bySku[sku];
      if (group.length > 1) {
        // Sort by creation date (keep oldest as master)
        // assuming id or implicit order is roughly chronological or just pick first
        const master = group[0];
        const duplicates = group.slice(1);

        console.log(`Resolving duplicates for SKU ${sku}. Master: ${master.id}`);

        for (const dup of duplicates) {
          // 1. Move Stock Moves
          await supabase
            .from("stock_moves")
            .update({ product_id: master.id })
            .eq("product_id", dup.id);

          // 2. Move/Merge Stock Quants
          const { data: dupQuants } = await supabase
            .from("stock_quants")
            .select("*")
            .eq("product_id", dup.id);

          if (dupQuants) {
            for (const dQuant of dupQuants) {
              // Check if master already has quant at this location
              const { data: mQuant } = await supabase
                .from("stock_quants")
                .select("id, quantity")
                .eq("product_id", master.id)
                .eq("location_id", dQuant.location_id)
                .maybeSingle();

              if (mQuant) {
                // Merge quantities
                await supabase
                  .from("stock_quants")
                  .update({ quantity: Number(mQuant.quantity) + Number(dQuant.quantity) })
                  .eq("id", mQuant.id);

                // Delete duplicate quant
                await supabase
                  .from("stock_quants")
                  .delete()
                  .eq("id", dQuant.id);
              } else {
                // Move quant ownership to master
                await supabase
                  .from("stock_quants")
                  .update({ product_id: master.id })
                  .eq("id", dQuant.id);
              }
            }
          }

          // 3. Move/Merge Branch Stock
          const { data: dupBranchStocks } = await supabase
            .from("branch_stock")
            .select("*")
            .eq("product_id", dup.id);

          if (dupBranchStocks) {
            for (const dStock of dupBranchStocks) {
              const { data: mStock } = await supabase
                .from("branch_stock")
                .select("id, quantity")
                .eq("product_id", master.id)
                .eq("branch_id", dStock.branch_id)
                .maybeSingle();

              if (mStock) {
                await supabase
                  .from("branch_stock")
                  .update({ quantity: Number(mStock.quantity) + Number(dStock.quantity) })
                  .eq("id", mStock.id);

                await supabase
                  .from("branch_stock")
                  .delete()
                  .eq("id", dStock.id);
              } else {
                await supabase
                  .from("branch_stock")
                  .update({ product_id: master.id })
                  .eq("id", dStock.id);
              }
            }
          }

          // 4. Archive/Delete Duplicate Product
          // We archive instead of delete to be safe for now, 
          // or we can mark it inactive.
          await supabase
            .from("products")
            .update({ is_active: false, sku: `${dup.sku}_OLD_${dup.id.substring(0, 4)}` })
            // Change SKU to avoid collision if we ever reactivate
            .eq("id", dup.id);

          fixedCount++;
        }
      }
    }

    if (fixedCount > 0) {
      toast.success(`تم دمج ${fixedCount} منتجات مكررة بنجاح`);
      // Reload to reflect changes
      loadProducts();
    }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", deleteProductId);

      if (error) throw error;

      toast.success("Product archived successfully");
      loadProducts();
      setDeleteProductId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to archive product");
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Products</h2>
          <div className="flex gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => navigate("/inventory/products/new")}
              size="sm"
              className="bg-[#017E84] hover:bg-[#015f63] text-white"
            >
              NEW
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first product</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filteredProducts.map((product) => {
              const onHandQty = stockQuantities[product.id] || 0;
              return (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden group relative"
                  onClick={() => navigate(`/inventory/products/${product.id}`)}
                >
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteProductId(product.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    <h3 className="font-medium text-xs line-clamp-2">{product.name}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">[{product.sku}]</p>
                    <div className="text-xs font-semibold">₪ {product.sales_price.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">{onHandQty.toFixed(0)} On Hand</div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="p-3 font-medium w-12"></th>
                    <th className="p-3 font-medium">Product Name</th>
                    <th className="p-3 font-medium">Internal Reference</th>
                    <th className="p-3 font-medium">Sales Price</th>
                    <th className="p-3 font-medium">Cost</th>
                    <th className="p-3 font-medium">On Hand</th>
                    <th className="p-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const avgCost = avgCosts[product.id] || 0;
                    const onHandQty = stockQuantities[product.id] || 0;
                    return (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/inventory/products/${product.id}`)}
                      >
                        <td className="p-3">
                          <div className="w-10 h-10 bg-muted rounded overflow-hidden flex items-center justify-center">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm font-medium">{product.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">[{product.sku}]</td>
                        <td className="p-3 text-sm">₪ {product.sales_price.toFixed(2)}</td>
                        <td className="p-3 text-sm">₪ {avgCost.toFixed(2)}</td>
                        <td className="p-3 text-sm">{onHandQty.toFixed(0)}</td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteProductId(product.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this product? It will be hidden from the product list but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Products;
