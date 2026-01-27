import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Advertisement {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean | null;
  display_order: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface FormData {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  start_date: string;
  end_date: string;
}

const initialFormData: FormData = {
  title: "",
  title_ar: "",
  description: "",
  description_ar: "",
  image_url: "",
  link_url: "",
  is_active: true,
  display_order: 0,
  start_date: "",
  end_date: "",
};

const Advertisements = () => {
  const { t } = useTranslation();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error: any) {
      toast.error("Failed to load advertisements");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ad?: Advertisement) => {
    if (ad) {
      setSelectedAd(ad);
      setFormData({
        title: ad.title,
        title_ar: ad.title_ar || "",
        description: ad.description || "",
        description_ar: ad.description_ar || "",
        image_url: ad.image_url || "",
        link_url: ad.link_url || "",
        is_active: ad.is_active ?? true,
        display_order: ad.display_order ?? 0,
        start_date: ad.start_date ? ad.start_date.split("T")[0] : "",
        end_date: ad.end_date ? ad.end_date.split("T")[0] : "",
      });
    } else {
      setSelectedAd(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `advertisements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const adData = {
        title: formData.title,
        title_ar: formData.title_ar || null,
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (selectedAd) {
        const { error } = await supabase
          .from("advertisements")
          .update(adData)
          .eq("id", selectedAd.id);

        if (error) throw error;
        toast.success("Advertisement updated successfully");
      } else {
        const { error } = await supabase
          .from("advertisements")
          .insert({
            ...adData,
            organization_id: profile?.organization_id,
            created_by: user.id,
          });

        if (error) throw error;
        toast.success("Advertisement created successfully");
      }

      setDialogOpen(false);
      loadAdvertisements();
    } catch (error: any) {
      toast.error(error.message || "Failed to save advertisement");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAd) return;

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", selectedAd.id);

      if (error) throw error;
      toast.success("Advertisement deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedAd(null);
      loadAdvertisements();
    } catch (error: any) {
      toast.error("Failed to delete advertisement");
      console.error(error);
    }
  };

  const openDeleteDialog = (ad: Advertisement) => {
    setSelectedAd(ad);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Advertisements</h2>
          <p className="text-sm text-muted-foreground">
            Manage homepage carousel advertisements
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 me-2" />
          Add Advertisement
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No advertisements yet. Click "Add Advertisement" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                advertisements.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ad.title}</p>
                        {ad.title_ar && (
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            {ad.title_ar}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.is_active ? "default" : "secondary"}>
                        {ad.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{ad.display_order}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ad.start_date && (
                          <p>Start: {new Date(ad.start_date).toLocaleDateString()}</p>
                        )}
                        {ad.end_date && (
                          <p>End: {new Date(ad.end_date).toLocaleDateString()}</p>
                        )}
                        {!ad.start_date && !ad.end_date && (
                          <span className="text-muted-foreground">Always</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {ad.link_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(ad.link_url!, "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenDialog(ad);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteDialog(ad);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAd ? "Edit Advertisement" : "Create Advertisement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-start gap-4">
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-32 h-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="w-32 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">
                      {uploading ? "Uploading..." : "Upload"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
                <div className="flex-1">
                  <Input
                    placeholder="Or paste image URL"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Titles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (English) *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_ar">Title (Arabic)</Label>
                <Input
                  id="title_ar"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder="أدخل العنوان"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ar">Description (Arabic)</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder="أدخل الوصف"
                  dir="rtl"
                  rows={3}
                />
              </div>
            </div>

            {/* Link URL */}
            <div className="space-y-2">
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            {/* Display Order and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="text-sm">{formData.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : selectedAd ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Advertisement</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Advertisements;
