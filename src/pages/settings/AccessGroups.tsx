import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, Loader2, Settings, Trash2, Save } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AccessGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface ModulePermission {
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
  { name: "settings", label: "Settings" },
  { name: "ecommerce", label: "eCommerce" },
  { name: "sales", label: "Sales" },
  { name: "inquiries", label: "Inquiries" },
  { name: "shop_admin", label: "Shop Control" },
];

const AccessGroups = () => {
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<AccessGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Permissions dialog state
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AccessGroup | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadGroups();
    }
  }, [organizationId]);

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
      toast.error("Failed to load organization");
    }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("access_groups")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Failed to load access groups");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("access_groups").insert({
        organization_id: organizationId,
        name: formData.name,
        description: formData.description || null,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Access group created successfully");
      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      loadGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create access group");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (group: AccessGroup) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const openPermissionsDialog = async (group: AccessGroup) => {
    setSelectedGroup(group);
    setPermissionsDialogOpen(true);
    setLoadingPermissions(true);

    try {
      const { data, error } = await supabase
        .from("module_permissions")
        .select("*")
        .eq("group_id", group.id);

      if (error) throw error;

      const initialPermissions: ModulePermission[] = MODULES.map(module => {
        const existing = data?.find(p => p.module_name === module.name);
        return {
          module_name: module.name,
          can_read: existing?.can_read ?? false,
          can_create: existing?.can_create ?? false,
          can_update: existing?.can_update ?? false,
          can_delete: existing?.can_delete ?? false,
        };
      });

      setPermissions(initialPermissions);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePermissionChange = (moduleName: string, field: keyof ModulePermission, value: boolean) => {
    setPermissions(prev => 
      prev.map(p => 
        p.module_name === moduleName ? { ...p, [field]: value } : p
      )
    );
  };

  const savePermissions = async () => {
    if (!selectedGroup) return;

    try {
      setSavingPermissions(true);

      await supabase
        .from("module_permissions")
        .delete()
        .eq("group_id", selectedGroup.id);

      const permissionsToInsert = permissions.map(p => ({
        group_id: selectedGroup.id,
        module_name: p.module_name,
        can_read: p.can_read,
        can_create: p.can_create,
        can_update: p.can_update,
        can_delete: p.can_delete,
      }));

      const { error } = await supabase
        .from("module_permissions")
        .insert(permissionsToInsert);

      if (error) throw error;

      toast.success("Permissions saved successfully");
      setPermissionsDialogOpen(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      setDeleting(true);

      await supabase
        .from("user_access_groups")
        .delete()
        .eq("group_id", groupToDelete.id);

      await supabase
        .from("module_permissions")
        .delete()
        .eq("group_id", groupToDelete.id);

      await supabase
        .from("field_permissions")
        .delete()
        .eq("group_id", groupToDelete.id);

      const { error } = await supabase
        .from("access_groups")
        .delete()
        .eq("id", groupToDelete.id);

      if (error) throw error;

      toast.success("Access group deleted successfully");
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      loadGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete access group");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Access Groups</CardTitle>
              <CardDescription>
                Create and manage access groups for organizing users and permissions
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No access groups yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Group
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.is_active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription>{group.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openPermissionsDialog(group)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Permissions
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openDeleteDialog(group)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Group
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Access Group</DialogTitle>
            <DialogDescription>
              Create a new access group to organize users and manage permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sales Team, Warehouse Staff"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this access group"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Configure Permissions - {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Set module access permissions for this group
            </DialogDescription>
          </DialogHeader>
          
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Module</TableHead>
                    <TableHead className="text-center">Read</TableHead>
                    <TableHead className="text-center">Create</TableHead>
                    <TableHead className="text-center">Update</TableHead>
                    <TableHead className="text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => {
                    const module = MODULES.find(m => m.name === permission.module_name);
                    return (
                      <TableRow key={permission.module_name}>
                        <TableCell className="font-medium">
                          {module?.label || permission.module_name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_read}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.module_name, 'can_read', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_create}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.module_name, 'can_create', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_update}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.module_name, 'can_update', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={permission.can_delete}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.module_name, 'can_delete', checked as boolean)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePermissions} disabled={savingPermissions || loadingPermissions}>
              {savingPermissions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Permissions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Access Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{groupToDelete?.name}"? This will also remove all associated permissions and user assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccessGroups;
