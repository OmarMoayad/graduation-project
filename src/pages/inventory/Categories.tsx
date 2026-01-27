import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Tags, Loader2, Pencil } from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: ""
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    description: ""
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadCategories();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("product_categories").insert({
      organization_id: organizationId,
      name: formData.name,
      code: formData.code || null,
      description: formData.description || null
    } as any);

    if (error) {
      toast.error(error.message || "Failed to create category");
    } else {
      toast.success("Category created successfully");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        code: "",
        description: ""
      });
      loadCategories();
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name,
      code: category.code || "",
      description: category.description || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const { error } = await supabase
      .from("product_categories")
      .update({
        name: editFormData.name,
        code: editFormData.code || null,
        description: editFormData.description || null
      })
      .eq("id", editingCategory.id);

    if (error) {
      toast.error(error.message || "Failed to update category");
    } else {
      toast.success("Category updated successfully");
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      loadCategories();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Product Categories</h2>
            <p className="text-muted-foreground">Organize your products by category</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>Add a new product category</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Category Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">Create Category</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
            <Card key={category.id} className="p-4 hover:shadow-lg transition-smooth">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Tags className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{category.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Badge variant={category.is_active ? "default" : "secondary"} className="ms-auto">
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {category.code && (
                    <p className="text-sm text-muted-foreground">Code: {category.code}</p>
                  )}
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          </div>
        )}

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الفئة</DialogTitle>
              <DialogDescription>تعديل اسم ورمز الفئة</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم الفئة *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-code">رمز الفئة</Label>
                <Input
                  id="edit-code"
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                  placeholder="اختياري"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">حفظ التعديلات</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {!loading && categories.length === 0 && (
          <Card className="p-12 text-center">
            <Tags className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first category</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Card>
        )}
      </div>
    </>
  );
};

export default Categories;
