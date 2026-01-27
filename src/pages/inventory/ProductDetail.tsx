import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, TrendingUp, Warehouse, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  sales_price: number;
  cost_price: number;
  product_type: string;
  uom: string;
  reorder_point: number;
  reorder_quantity: number;
  category: { name: string } | null;
}

interface PurchaseHistory {
  id: string;
  order_number: string;
  order_date: string;
  unit_price: number;
  vendor: { name: string } | null;
}

interface StockMove {
  id: string;
  move_type: string;
  quantity: number;
  reference: string | null;
  created_at: string;
  source_location: { name: string } | null;
  destination_location: { name: string } | null;
}

interface StockQuant {
  location: { name: string; warehouse: { name: string } | null } | null;
  quantity: number;
}

interface BranchStockItem {
  branch: { name: string; name_ar: string | null; code: string } | null;
  quantity: number;
  section: string | null;
  shelf: string | null;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [stockQuants, setStockQuants] = useState<StockQuant[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStockItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [avgCost, setAvgCost] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const cleanupStockDuplicates = async (productQuants: any[]) => {
    // Group quants by warehouse
    const byWarehouse: Record<string, typeof productQuants> = {};

    productQuants.forEach(q => {
      const whId = q.location?.warehouse?.id;
      if (whId) {
        if (!byWarehouse[whId]) byWarehouse[whId] = [];
        byWarehouse[whId].push(q);
      }
    });

    // Check for duplicates
    let madeChanges = false;
    for (const whId in byWarehouse) {
      const quants = byWarehouse[whId];
      if (quants.length > 1) {
        // Found duplicates for this warehouse
        console.log(`Found duplicate stock for warehouse ${whId}`, quants);

        // 1. Identify the "Master" quant (prefer location name "Stock")
        let master = quants.find(q => q.location?.name === "Stock");
        if (!master) master = quants[0];

        // 2. Calculate total quantity from others
        const others = quants.filter(q => q.id !== master.id);
        const quantityToAdd = others.reduce((sum, q) => sum + (Number(q.quantity) || 0), 0);

        if (quantityToAdd > 0 || others.length > 0) {
          // 3. Update master
          await supabase
            .from("stock_quants")
            .update({ quantity: Number(master.quantity) + quantityToAdd })
            .eq("id", master.id);

          // 4. Delete others
          for (const other of others) {
            await supabase
              .from("stock_quants")
              .delete()
              .eq("id", other.id);
          }
          madeChanges = true;
        }
      }
    }

    if (madeChanges) {
      toast({
        title: "تم توحيد المخزون",
        description: "تم دمج سجلات المخزون المكررة في المستودع تلقائياً",
      });
      // Improve: Recursively reload or just proceed (fetching again would be safer but loop risk?)
      // We will just let the user refresh or rely on the next fetch
    }
  };

  const fetchProductDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`
          *,
          category:product_categories(name)
        `)
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .single();

      if (productError) throw productError;
      setProduct(productData as any);

      // Fetch stock moves
      const { data: movesData, error: movesError } = await supabase
        .from("stock_moves")
        .select(`
          id,
          move_type,
          quantity,
          reference,
          created_at,
          source_location:locations!source_location_id(name),
          destination_location:locations!destination_location_id(name)
        `)
        .eq("product_id", id)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (movesError) throw movesError;
      setStockMoves(movesData as any || []);

      // Fetch stock quants
      const { data: quantsData, error: quantsError } = await supabase
        .from("stock_quants")
        .select(`
          id,
          quantity,
          location:locations(
            id,
            name,
            warehouse:warehouses(id, name)
          )
        `)
        .eq("product_id", id)
        .eq("organization_id", profile.organization_id)
        .gt("quantity", 0);

      if (quantsError) throw quantsError;

      // [Auto-Fix] Run cleanup for duplicates
      if (quantsData && quantsData.length > 0) {
        await cleanupStockDuplicates(quantsData);

        // Refresh local state after cleanup (filtered)
        // We do a manual filter here to avoid a double network call, 
        // essentially simulating what the DB state represents now.
        // Group by warehouse again to display consolidated view locally
        const byWarehouse: Record<string, any> = {};
        quantsData.forEach((q: any) => {
          const whId = q.location?.warehouse?.id;
          if (whId) {
            if (!byWarehouse[whId]) {
              byWarehouse[whId] = { ...q }; // Clone first one as master
            } else {
              byWarehouse[whId].quantity += q.quantity; // Add quantity
            }
          }
        });
        setStockQuants(Object.values(byWarehouse));
      } else {
        setStockQuants([]);
      }

      // Fetch branch stock
      const { data: branchStockData, error: branchStockError } = await supabase
        .from("branch_stock")
        .select(`
          quantity,
          section,
          shelf,
          branch:branches(name, name_ar, code)
        `)
        .eq("product_id", id)
        .eq("organization_id", profile.organization_id)
        .gt("quantity", 0);

      if (branchStockError) throw branchStockError;
      setBranchStock(branchStockData as any || []);

      // Fetch purchase history from purchase order lines
      const { data: purchaseData, error: purchaseError } = await supabase
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

      if (!purchaseError && purchaseData) {
        const history = purchaseData
          .filter(line => line.purchase_order)
          .map(line => ({
            id: line.id,
            order_number: (line.purchase_order as any).order_number,
            order_date: (line.purchase_order as any).order_date,
            unit_price: line.unit_price,
            vendor: (line.purchase_order as any).vendor
          }));
        setPurchaseHistory(history);

        // Calculate average cost from purchase history
        if (history.length > 0) {
          const avg = history.reduce((sum, item) => sum + item.unit_price, 0) / history.length;
          setAvgCost(avg);
        }
      }
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

  const getMoveTypeColor = (type: string) => {
    return type === "in" ? "bg-green-500" : "bg-red-500";
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!product) {
    return <div className="container mx-auto p-6">Product not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/inventory/products")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-semibold">{product.sku}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-semibold">{product.category?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Barcode</p>
                <p className="font-semibold">{product.barcode || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sales Price</p>
                <p className="font-semibold">₪{product.sales_price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Cost</p>
                <p className="font-semibold">₪{avgCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">{product.product_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit of Measure</p>
                <p className="font-semibold uppercase">{product.uom}</p>
              </div>
            </div>
            {product.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Reorder Point</p>
              <p className="font-semibold">{product.reorder_point}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reorder Quantity</p>
              <p className="font-semibold">{product.reorder_quantity}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList>
          <TabsTrigger value="purchase">
            <TrendingUp className="mr-2 h-4 w-4" />
            Purchase History
          </TabsTrigger>
          <TabsTrigger value="movements">
            Stock Movements
          </TabsTrigger>
          <TabsTrigger value="onhand">
            <Warehouse className="mr-2 h-4 w-4" />
            On-Hand (Warehouse)
          </TabsTrigger>
          <TabsTrigger value="branches">
            <Store className="mr-2 h-4 w-4" />
            On-Hand (Branches)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <Card>
            <CardContent className="pt-6">
              {purchaseHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase history yet
                </div>
              ) : (
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
                    {purchaseHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.vendor?.name || "-"}
                        </TableCell>
                        <TableCell>₪{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(item.order_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{item.order_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardContent className="pt-6">
              {stockMoves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stock movements yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMoves.map((move) => (
                      <TableRow key={move.id}>
                        <TableCell>
                          <Badge className={getMoveTypeColor(move.move_type)}>
                            {move.move_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{move.quantity}</TableCell>
                        <TableCell>
                          {move.source_location?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {move.destination_location?.name || "-"}
                        </TableCell>
                        <TableCell>{move.reference || "-"}</TableCell>
                        <TableCell>
                          {new Date(move.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onhand">
          <Card>
            <CardContent className="pt-6">
              {stockQuants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stock on hand
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockQuants.map((quant, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {quant.location?.warehouse?.name || "-"}
                        </TableCell>
                        <TableCell>{quant.location?.name || "-"}</TableCell>
                        <TableCell className="font-semibold">
                          {quant.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardContent className="pt-6">
              {branchStock.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stock in branches
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Section / Shelf</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchStock.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.branch?.name_ar || item.branch?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {item.section || item.shelf || "-"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {item.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
