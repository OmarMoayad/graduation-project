import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PurchaseOrders from "./PurchaseOrders";
import VendorPricelist from "./VendorPricelist";
import { ShoppingCart, DollarSign } from "lucide-react";

const Purchases = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "orders";

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Purchase Management</h1>
          <p className="text-muted-foreground">Manage purchase orders and vendor pricelists</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Purchase Orders
            </TabsTrigger>
            <TabsTrigger value="pricelist" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Vendor Pricelists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <PurchaseOrders />
          </TabsContent>

          <TabsContent value="pricelist" className="mt-6">
            <VendorPricelist />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Purchases;
