import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Phone, Building, Briefcase, Calendar, Save, ArrowLeft, Camera, MapPin } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import LeaveRequestDialog from "@/components/hr/LeaveRequestDialog";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  is_active: boolean | null;
  is_on_leave: boolean | null;
  address: string | null;
  branch_id: string | null;
  branch: string | null;
}

interface Branch {
  id: string;
  name: string;
  name_ar: string | null;
}

const MyProfile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, name_ar")
        .eq("is_active", true);

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, position, department, hire_date, is_active, is_on_leave, address, branch_id, branch")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.invalidImageType'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success(t('profile.avatarUpdated'));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(t('common.error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
      });
      setEditMode(false);
      toast.success(t('common.saved'));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const getBranchName = () => {
    if (!profile?.branch_id) return profile?.branch || "-";
    const branch = branches.find(b => b.id === profile.branch_id);
    if (!branch) return profile?.branch || "-";
    return i18n.language === 'ar' && branch.name_ar ? branch.name_ar : branch.name;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-muted-foreground">{t('profile.notFound')}</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('profile.myProfile')}</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">
                  {profile.full_name || profile.email}
                </CardTitle>
                <p className="text-muted-foreground">{profile.position || t('profile.noPosition')}</p>
                <div className="flex gap-2 mt-2">
                  {profile.is_active && (
                    <Badge variant="default" className="bg-green-500">
                      {t('common.active')}
                    </Badge>
                  )}
                  {profile.is_on_leave && (
                    <Badge variant="secondary" className="bg-yellow-500 text-black">
                      {t('hr.onLeave')}
                    </Badge>
                  )}
                </div>
              </div>
              {!editMode && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsLeaveDialogOpen(true)}>
                    <Calendar className="me-2 h-4 w-4" />
                    {t('hr.requestLeave')}
                  </Button>
                  <Button onClick={() => setEditMode(true)}>
                    {t('common.edit')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {editMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('profile.fullName')}</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder={t('profile.fullName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('profile.phone')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t('profile.address')}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t('profile.address')}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    <Save className="me-2 h-4 w-4" />
                    {t('common.save')}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.fullName')}</p>
                    <p className="font-medium">{profile.full_name || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
                    <p className="font-medium">{profile.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.phone')}</p>
                    <p className="font-medium">{profile.phone || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.department')}</p>
                    <p className="font-medium">{profile.department || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.position')}</p>
                    <p className="font-medium">{profile.position || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.hireDate')}</p>
                    <p className="font-medium">
                      {profile.hire_date
                        ? new Date(profile.hire_date).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.address')}</p>
                    <p className="font-medium">{profile.address || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('profile.branch')}</p>
                    <p className="font-medium">{getBranchName()}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <LeaveRequestDialog
          open={isLeaveDialogOpen}
          onOpenChange={setIsLeaveDialogOpen}
        />
      </div>
    </AppLayout>
  );
};

export default MyProfile;
