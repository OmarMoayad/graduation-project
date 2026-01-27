import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Products from "./Products";
import Warehouses from "./Warehouses";
import Categories from "./Categories";
import { Package, Warehouse, Tags } from "lucide-react";

const Inventory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "products";

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
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage products, warehouses, locations, and categories</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouses
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <Products />
          </TabsContent>

          <TabsContent value="warehouses" className="mt-6">
            <Warehouses />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Categories />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Inventory;
