import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UserPlus, Mail, Shield, Loader2, User, Users as UsersIcon, Pencil, Trash2, Phone, Clock, CheckCircle, XCircle } from "lucide-react";
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

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean | null;
  organization_id: string | null;
  approval_status?: string | null;
  created_at?: string | null;
}

interface PendingUser {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface AccessGroup {
  id: string;
  name: string;
}

interface UserAccessGroup {
  id: string;
  user_id: string;
  group_id: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [accessGroups, setAccessGroups] = useState<AccessGroup[]>([]);
  const [userAccessGroups, setUserAccessGroups] = useState<UserAccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);
  const [rejectingUser, setRejectingUser] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "staff",
  });

  const [editFormData, setEditFormData] = useState({
    fullName: "",
    phone: "",
    role: "staff",
    isActive: true,
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadUsers();
      loadAccessGroups();
      loadPendingUsers();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

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

  const loadPendingUsers = async () => {
    try {
      // Load all pending users (from any organization) so admin can approve them
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error("Error loading pending users:", error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!organizationId) return;

    try {
      setApprovingUser(userId);

      // Approve user and move to current organization
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: currentUserId,
          organization_id: organizationId,
          is_active: true,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("User approved successfully");
      loadPendingUsers();
      loadUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
    } finally {
      setApprovingUser(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      setRejectingUser(userId);

      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "rejected",
          is_active: false,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("User rejected");
      loadPendingUsers();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user");
    } finally {
      setRejectingUser(null);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const { data: userAccessData, error: userAccessError } = await supabase
        .from("user_access_groups")
        .select("*");

      if (userAccessError) throw userAccessError;

      setUsers(profilesData || []);
      setUserRoles(rolesData || []);
      setUserAccessGroups(userAccessData || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadAccessGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("access_groups")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setAccessGroups(data || []);
    } catch (error) {
      console.error("Error loading access groups:", error);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    try {
      setCreating(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            organization_id: organizationId,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            organization_id: organizationId,
            phone: formData.phone || null,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Error updating profile organization:", profileError);
        }

        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: formData.role as "admin" | "manager" | "staff" | "viewer",
        });

        if (roleError) throw roleError;

        toast.success("User created successfully");
        setCreateDialogOpen(false);
        setFormData({ fullName: "", email: "", password: "", phone: "", role: "staff" });
        loadUsers();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    const userRole = userRoles.find(r => r.user_id === user.id);
    setEditFormData({
      fullName: user.full_name || "",
      phone: user.phone || "",
      role: userRole?.role || "staff",
      isActive: user.is_active ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editFormData.fullName,
          phone: editFormData.phone || null,
          is_active: editFormData.isActive,
        })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      // Update role
      const existingRole = userRoles.find(r => r.user_id === selectedUser.id);
      if (existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: editFormData.role as "admin" | "manager" | "staff" | "viewer" })
          .eq("id", existingRole.id);

        if (roleError) throw roleError;
      } else {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedUser.id,
            role: editFormData.role as "admin" | "manager" | "staff" | "viewer",
          });

        if (roleError) throw roleError;
      }

      toast.success("User updated successfully");
      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleting(true);

      // Delete user access groups
      await supabase
        .from("user_access_groups")
        .delete()
        .eq("user_id", selectedUser.id);

      // Delete user roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.id);

      // Deactivate profile (can't delete auth user from client)
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("User deactivated successfully");
      setDeleteDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const openAccessDialog = (user: UserProfile) => {
    setSelectedUser(user);
    const currentGroups = userAccessGroups
      .filter(uag => uag.user_id === user.id)
      .map(uag => uag.group_id);
    setSelectedGroups(currentGroups);
    setAccessDialogOpen(true);
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSaveAccess = async () => {
    if (!selectedUser) return;

    try {
      setSavingAccess(true);

      await supabase
        .from("user_access_groups")
        .delete()
        .eq("user_id", selectedUser.id);

      if (selectedGroups.length > 0) {
        const insertData = selectedGroups.map(groupId => ({
          user_id: selectedUser.id,
          group_id: groupId,
        }));

        const { error } = await supabase
          .from("user_access_groups")
          .insert(insertData);

        if (error) throw error;
      }

      toast.success("Access groups updated successfully");
      setAccessDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error saving access groups:", error);
      toast.error("Failed to update access groups");
    } finally {
      setSavingAccess(false);
    }
  };

  const getUserRole = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || "No role";
  };

  const getUserGroups = (userId: string) => {
    const groupIds = userAccessGroups
      .filter(uag => uag.user_id === userId)
      .map(uag => uag.group_id);
    return accessGroups.filter(g => groupIds.includes(g.id));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "staff":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
      {/* Pending Approval Requests */}
      {pendingUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-200">
                  Pending Approval Requests ({pendingUsers.length})
                </CardTitle>
                <CardDescription>
                  New users waiting for approval to join the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveUser(user.id)}
                          disabled={approvingUser === user.id || rejectingUser === user.id}
                        >
                          {approvingUser === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 me-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectUser(user.id)}
                          disabled={approvingUser === user.id || rejectingUser === user.id}
                        >
                          {rejectingUser === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 me-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Create and manage system users with their roles and access rights</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access Groups</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userGroups = getUserGroups(user.id);
                const isCurrentUser = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(getUserRole(user.id))}>
                        {getUserRole(user.id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userGroups.length > 0 ? (
                          userGroups.map(group => (
                            <Badge key={group.id} variant="outline" className="text-xs">
                              {group.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No groups</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openAccessDialog(user)}
                          title="Manage Access"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        {!isCurrentUser && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with email and password authentication
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="+970 59 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="editFullName"
                  placeholder="John Doe"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="editPhone"
                  placeholder="+970 59 123 4567"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="editIsActive"
                checked={editFormData.isActive}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, isActive: checked })}
              />
              <Label htmlFor="editIsActive">Active User</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Access Dialog */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Access Groups</DialogTitle>
            <DialogDescription>
              Assign access groups to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {accessGroups.length === 0 ? (
              <div className="text-center py-4">
                <UsersIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No access groups available</p>
                <p className="text-sm text-muted-foreground">Create access groups first to assign users</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accessGroups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={group.id}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <Label htmlFor={group.id} className="flex-1 cursor-pointer">
                      {group.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccess} disabled={savingAccess || accessGroups.length === 0}>
              {savingAccess ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Access"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{selectedUser?.full_name || selectedUser?.email}"? 
              This user will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
