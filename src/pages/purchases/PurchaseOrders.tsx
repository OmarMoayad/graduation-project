import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrder {
  id: string;
  order_number: string;
  order_date: string;
  expected_date: string | null;
  status: string;
  total_amount: number;
  vendor: {
    name: string;
  };
}

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
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
        .from("purchase_orders")
        .select(`
          id,
          order_number,
          order_date,
          expected_date,
          status,
          total_amount,
          vendor:contacts!vendor_id(name)
        `)
        .eq("organization_id", profile.organization_id)
        .order("order_date", { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data as any || []);
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

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-500",
      confirmed: "bg-blue-500",
      received: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Button onClick={() => navigate("/purchases/create")}>
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : purchaseOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No purchase orders yet</p>
            <Button onClick={() => navigate("/purchases/create")}>
              Create First Purchase Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {purchaseOrders.map((po) => (
            <Card
              key={po.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/purchases/${po.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{po.order_number}</CardTitle>
                  <Badge className={getStatusColor(po.status)}>
                    {po.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {po.vendor.name}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(po.order_date).toLocaleDateString()}
                </div>
                <div className="text-lg font-semibold mt-2">
                  ${po.total_amount.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
