import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Loader2, Save } from "lucide-react";

interface AccessGroup {
  id: string;
  name: string;
}

interface FieldPermission {
  id: string;
  module_name: string;
  field_name: string;
  can_read: boolean;
  can_write: boolean;
}

const MODULE_FIELDS = {
  contacts: ["name", "email", "phone", "mobile", "address", "tax_id", "credit_limit"],
  products: ["name", "sku", "barcode", "sales_price", "cost_price", "category", "description"],
  purchases: ["order_number", "vendor", "order_date", "expected_date", "status", "total_amount"],
  pos: ["order_number", "customer", "total_amount", "payment_method", "status"],
  inventory: ["product", "location", "quantity", "lot_number", "serial_number"],
};

const FieldPermissions = () => {
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("contacts");
  const [permissions, setPermissions] = useState<FieldPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadGroups();
    }
  }, [organizationId]);

  useEffect(() => {
    if (selectedGroup && selectedModule) {
      loadPermissions();
    }
  }, [selectedGroup, selectedModule]);

  const loadOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setOrganizationId(data.organization_id);
    } catch (error) {
      console.error("Error loading organization:", error);
    }
  };

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("access_groups")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setGroups(data || []);
      if (data && data.length > 0) {
        setSelectedGroup(data[0].id);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Failed to load access groups");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("field_permissions")
        .select("*")
        .eq("group_id", selectedGroup)
        .eq("module_name", selectedModule);

      if (error) throw error;

      // Initialize permissions for all fields
      const fields = MODULE_FIELDS[selectedModule as keyof typeof MODULE_FIELDS] || [];
      const existingPerms = data || [];
      const allPerms = fields.map((field) => {
        const existing = existingPerms.find((p) => p.field_name === field);
        return existing || {
          id: "",
          module_name: selectedModule,
          field_name: field,
          can_read: false,
          can_write: false,
        };
      });

      setPermissions(allPerms);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (fieldName: string, permissionType: "can_read" | "can_write", value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.field_name === fieldName ? { ...p, [permissionType]: value } : p
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Delete existing permissions for this group and module
      await supabase
        .from("field_permissions")
        .delete()
        .eq("group_id", selectedGroup)
        .eq("module_name", selectedModule);

      // Insert new permissions (only for fields with at least one permission)
      const permsToInsert = permissions
        .filter((p) => p.can_read || p.can_write)
        .map((p) => ({
          group_id: selectedGroup,
          module_name: selectedModule,
          field_name: p.field_name,
          can_read: p.can_read,
          can_write: p.can_write,
        }));

      if (permsToInsert.length > 0) {
        const { error } = await supabase
          .from("field_permissions")
          .insert(permsToInsert);

        if (error) throw error;
      }

      toast.success("Field permissions saved successfully");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save field permissions");
    } finally {
      setSaving(false);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Permissions</CardTitle>
          <CardDescription>No access groups available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please create an access group first before configuring field permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Permissions</CardTitle>
              <CardDescription>
                Configure field-level access rights for specific modules
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="purchases">Purchases</SelectItem>
                  <SelectItem value="pos">Point of Sale</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead className="text-center">Read Access</TableHead>
                  <TableHead className="text-center">Write Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.field_name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        {perm.field_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={perm.can_read}
                          onCheckedChange={(checked) =>
                            updatePermission(perm.field_name, "can_read", checked)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={perm.can_write}
                          onCheckedChange={(checked) =>
                            updatePermission(perm.field_name, "can_write", checked)
                          }
                        />
                      </div>
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

export default FieldPermissions;
