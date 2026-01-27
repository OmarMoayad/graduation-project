import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Loader2, Save } from "lucide-react";

interface AccessGroup {
  id: string;
  name: string;
}

interface ModulePermission {
  id: string;
  module_name: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const MODULES = [
  { name: "dashboard", label: "Dashboard" },
  { name: "contacts", label: "Contacts" },
  { name: "inventory", label: "Inventory" },
  { name: "products", label: "Products" },
  { name: "purchases", label: "Purchases" },
  { name: "pos", label: "Point of Sale" },
  { name: "reports", label: "Reports" },
  { name: "accounts", label: "Accounts" },
  { name: "settings", label: "Settings" },
  { name: "ecommerce", label: "eCommerce" },
  { name: "sales", label: "Sales" },
  { name: "inquiries", label: "Inquiries" },
  { name: "shop_admin", label: "Shop Control" },
  { name: "hr", label: "Human Resources" },
];

const ModulePermissions = () => {
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
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
    if (selectedGroup) {
      loadPermissions();
    }
  }, [selectedGroup]);

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
        .from("module_permissions")
        .select("*")
        .eq("group_id", selectedGroup);

      if (error) throw error;

      // Initialize permissions for all modules
      const existingPerms = data || [];
      const allPerms = MODULES.map((module) => {
        const existing = existingPerms.find((p) => p.module_name === module.name);
        return existing || {
          id: "",
          module_name: module.name,
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false,
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

  const updatePermission = (moduleName: string, field: string, value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module_name === moduleName ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Delete existing permissions for this group
      await supabase
        .from("module_permissions")
        .delete()
        .eq("group_id", selectedGroup);

      // Insert new permissions (only for modules with at least one permission)
      const permsToInsert = permissions
        .filter((p) => p.can_read || p.can_create || p.can_update || p.can_delete)
        .map((p) => ({
          group_id: selectedGroup,
          module_name: p.module_name,
          can_read: p.can_read,
          can_create: p.can_create,
          can_update: p.can_update,
          can_delete: p.can_delete,
        }));

      if (permsToInsert.length > 0) {
        const { error } = await supabase
          .from("module_permissions")
          .insert(permsToInsert);

        if (error) throw error;
      }

      toast.success("Permissions saved successfully");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
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
          <CardTitle>Module Permissions</CardTitle>
          <CardDescription>No access groups available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please create an access group first before configuring module permissions.
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
              <CardTitle>Module Permissions</CardTitle>
              <CardDescription>
                Configure module-level access rights for access groups
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select access group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
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
                    Save Changes
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
                  <TableHead>Module</TableHead>
                  <TableHead className="text-center">Read</TableHead>
                  <TableHead className="text-center">Create</TableHead>
                  <TableHead className="text-center">Update</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULES.map((module) => {
                  const perm = permissions.find((p) => p.module_name === module.name);
                  return (
                    <TableRow key={module.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          {module.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm?.can_read || false}
                          onCheckedChange={(checked) =>
                            updatePermission(module.name, "can_read", checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm?.can_create || false}
                          onCheckedChange={(checked) =>
                            updatePermission(module.name, "can_create", checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm?.can_update || false}
                          onCheckedChange={(checked) =>
                            updatePermission(module.name, "can_update", checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perm?.can_delete || false}
                          onCheckedChange={(checked) =>
                            updatePermission(module.name, "can_delete", checked as boolean)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModulePermissions;
