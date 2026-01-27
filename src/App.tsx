import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { clearInvalidAuthSessionIfNeeded } from "@/lib/auth-recovery";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/contacts/Contacts";
import Inventory from "./pages/inventory/Inventory";
import ProductDetail from "./pages/inventory/ProductDetail";
import ProductForm from "./pages/inventory/ProductForm";
import Purchases from "./pages/purchases/Purchases";
import CreatePurchaseOrder from "./pages/purchases/CreatePurchaseOrder";
import PurchaseOrderDetail from "./pages/purchases/PurchaseOrderDetail";
import Reports from "./pages/reports/Reports";
import SalesHeatmap from "./pages/reports/SalesHeatmap";
import PointOfSale from "./pages/pos/PointOfSale";
import POSSelling from "./pages/pos/POSSelling";
import OrdersView from "./pages/pos/OrdersView";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Shop from "./pages/shop/Shop";
import Cart from "./pages/shop/Cart";
import Checkout from "./pages/shop/Checkout";
import Account from "./pages/shop/Account";
import Sales from "./pages/sales/Sales";
import SalesOrderDetail from "./pages/sales/SalesOrderDetail";
import DeliveryCompanies from "./pages/settings/DeliveryCompanies";
import Inquiries from "./pages/inquiries/Inquiries";
import ShopSettings from "./pages/shop-admin/ShopSettings";
import ShopAdmin from "./pages/shop-admin/ShopAdmin";
import Messages from "./pages/messages/Messages";
import HumanResources from "./pages/hr/HumanResources";
import EmployeeProfile from "./pages/hr/EmployeeProfile";
import EditEmployee from "./pages/hr/EditEmployee";
import MyProfile from "./pages/profile/MyProfile";
import Branches from "./pages/branches/Branches";
import Accounts from "./pages/accounts/Accounts";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    void (async () => {
      const cleared = await clearInvalidAuthSessionIfNeeded();
      if (cleared) window.location.reload();
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/products/:id" element={<ProductForm />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/purchases/create" element={<CreatePurchaseOrder />} />
            <Route path="/purchases/:id" element={<PurchaseOrderDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/heatmap" element={<SalesHeatmap />} />
            <Route path="/pos" element={<PointOfSale />} />
            <Route path="/pos/session/:sessionId/sell" element={<POSSelling />} />
            <Route path="/pos/session/:sessionId/orders" element={<OrdersView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/delivery-companies" element={<DeliveryCompanies />} />
            {/* eCommerce Shop Routes */}
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/cart" element={<Cart />} />
            <Route path="/shop/checkout" element={<Checkout />} />
            <Route path="/shop/account" element={<Account />} />
            {/* Sales Module */}
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/:id" element={<SalesOrderDetail />} />
            {/* Inquiries */}
            <Route path="/inquiries" element={<Inquiries />} />
            {/* Messages */}
            <Route path="/messages" element={<Messages />} />
            {/* Shop Admin */}
            <Route path="/shop-admin" element={<ShopAdmin />} />
            <Route path="/shop-admin/settings" element={<ShopSettings />} />
            {/* Human Resources */}
            <Route path="/hr" element={<HumanResources />} />
            <Route path="/hr/employee/:id" element={<EmployeeProfile />} />
            <Route path="/hr/employee/:id/edit" element={<EditEmployee />} />
            {/* Branches */}
            <Route path="/branches" element={<Branches />} />
            {/* User Profile */}
            <Route path="/profile" element={<MyProfile />} />
            {/* Accounts / Finance */}
            <Route path="/accounts" element={<Accounts />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
