import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users as UsersIcon, UserCog, Shield, Key, Megaphone, Truck, UserCheck } from "lucide-react";
import Users from "./settings/Users";
import AccessGroups from "./settings/AccessGroups";
import ModulePermissions from "./settings/ModulePermissions";
import FieldPermissions from "./settings/FieldPermissions";
import Advertisements from "./settings/Advertisements";
import DeliveryCompanies from "./settings/DeliveryCompanies";
import DeliveryDrivers from "./settings/DeliveryDrivers";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage users, access rights, and permissions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 max-w-5xl">
            <TabsTrigger value="users">
              <UsersIcon className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="access-groups">
              <UserCog className="w-4 h-4 mr-2" />
              Access Groups
            </TabsTrigger>
            <TabsTrigger value="module-permissions">
              <Shield className="w-4 h-4 mr-2" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="field-permissions">
              <Key className="w-4 h-4 mr-2" />
              Fields
            </TabsTrigger>
            <TabsTrigger value="delivery-companies">
              <Truck className="w-4 h-4 mr-2" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="delivery-drivers">
              <UserCheck className="w-4 h-4 mr-2" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="advertisements">
              <Megaphone className="w-4 h-4 mr-2" />
              Ads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-6">
            <Users />
          </TabsContent>

          <TabsContent value="access-groups" className="space-y-4 mt-6">
            <AccessGroups />
          </TabsContent>

          <TabsContent value="module-permissions" className="space-y-4 mt-6">
            <ModulePermissions />
          </TabsContent>

          <TabsContent value="field-permissions" className="space-y-4 mt-6">
            <FieldPermissions />
          </TabsContent>

          <TabsContent value="delivery-companies" className="space-y-4 mt-6">
            <DeliveryCompanies />
          </TabsContent>

          <TabsContent value="delivery-drivers" className="space-y-4 mt-6">
            <DeliveryDrivers />
          </TabsContent>

          <TabsContent value="advertisements" className="space-y-4 mt-6">
            <Advertisements />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
