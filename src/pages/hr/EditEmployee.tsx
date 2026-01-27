import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  User,
} from "lucide-react";

interface EmployeeForm {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  branch: string;
  address: string;
  hire_date: string;
  salary: string;
  is_on_leave: boolean;
  leave_start: string;
  leave_end: string;
  leave_reason: string;
}

const EditEmployee = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EmployeeForm>({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    branch: "",
    address: "",
    hire_date: "",
    salary: "",
    is_on_leave: false,
    leave_start: "",
    leave_end: "",
    leave_reason: "",
  });

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        position: data.position || "",
        department: data.department || "",
        branch: data.branch || "",
        address: data.address || "",
        hire_date: data.hire_date || "",
        salary: data.salary?.toString() || "",
        is_on_leave: data.is_on_leave || false,
        leave_start: data.leave_start || "",
        leave_end: data.leave_end || "",
        leave_reason: data.leave_reason || "",
      });
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error(t("hr.loadFailed"));
      navigate("/hr");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          branch: formData.branch,
          address: formData.address,
          hire_date: formData.hire_date || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          is_on_leave: formData.is_on_leave,
          leave_start: formData.is_on_leave ? formData.leave_start || null : null,
          leave_end: formData.is_on_leave ? formData.leave_end || null : null,
          leave_reason: formData.is_on_leave ? formData.leave_reason || null : null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(t("common.saved"));
      navigate(`/hr/employee/${id}`);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EmployeeForm, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/hr/employee/${id}`)}>
            {isRTL ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
            {t("common.back")}
          </Button>
          <h1 className="text-2xl font-bold">{t("hr.editEmployee")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("hr.basicInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t("hr.fullName")}</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("hr.phone")}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("hr.address")}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("hr.workInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">{t("hr.position")}</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">{t("hr.department")}</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">{t("hr.branch")}</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => handleChange("branch", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">{t("hr.salary")}</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleChange("salary", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">{t("hr.hireDate")}</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => handleChange("hire_date", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("hr.leaveInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_on_leave">{t("hr.isOnLeave")}</Label>
                <Switch
                  id="is_on_leave"
                  checked={formData.is_on_leave}
                  onCheckedChange={(checked) => handleChange("is_on_leave", checked)}
                />
              </div>

              {formData.is_on_leave && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave_start">{t("hr.startDate")}</Label>
                    <Input
                      id="leave_start"
                      type="date"
                      value={formData.leave_start}
                      onChange={(e) => handleChange("leave_start", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave_end">{t("hr.endDate")}</Label>
                    <Input
                      id="leave_end"
                      type="date"
                      value={formData.leave_end}
                      onChange={(e) => handleChange("leave_end", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="leave_reason">{t("hr.reason")}</Label>
                    <Textarea
                      id="leave_reason"
                      value={formData.leave_reason}
                      onChange={(e) => handleChange("leave_reason", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/hr/employee/${id}`)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="me-2 h-4 w-4" />
              )}
              {t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default EditEmployee;