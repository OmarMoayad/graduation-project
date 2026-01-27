import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Mail,
  Phone,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Clock,
  Shield,
  KeyRound,
  Loader2,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  salary: number | null;
  is_on_leave: boolean;
  leave_start: string | null;
  leave_end: string | null;
  leave_reason: string | null;
  approval_status: string;
  created_at: string;
  avatar_url: string | null;
  is_active: boolean | null;
  branch: string | null;
  address: string | null;
}

const EmployeeProfile = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";
  const dateLocale = isRTL ? ar : enUS;

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

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
      setEmployee(data as Employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error(t("hr.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
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
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <Users className="h-16 w-16 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{t("hr.employeeNotFound")}</p>
          <Button onClick={() => navigate("/hr")}>
            {isRTL ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
            {t("hr.backToHR")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/hr")}>
            {isRTL ? <ArrowRight className="me-2 h-4 w-4" /> : <ArrowLeft className="me-2 h-4 w-4" />}
            {t("hr.backToHR")}
          </Button>
          <Button onClick={() => navigate(`/hr/employee/${id}/edit`)}>
            <Edit className="me-2 h-4 w-4" />
            {t("common.edit")}
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={employee.avatar_url || ""} alt={employee.full_name} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {getInitials(employee.full_name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2 pt-4 md:pt-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{employee.full_name}</h1>
                  {employee.is_on_leave ? (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      {t("hr.onLeaveStatus")}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      {t("hr.working")}
                    </Badge>
                  )}
                  {employee.approval_status === "approved" && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      <Shield className="h-3 w-3 me-1" />
                      {t("hr.approved")}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-lg">
                  {employee.position || t("hr.noPosition")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                {t("hr.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("common.email")}</p>
                <p className="font-medium">{employee.email || "-"}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.phone")}</p>
                <p className="font-medium">{employee.phone || "-"}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.address")}</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{employee.address || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" />
                {t("hr.workInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.position")}</p>
                <p className="font-medium">{employee.position || "-"}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.department")}</p>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{employee.department || "-"}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.branch")}</p>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{employee.branch || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                {t("hr.datesStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.hireDate")}</p>
                <p className="font-medium">
                  {employee.hire_date
                    ? format(new Date(employee.hire_date), "PPP", { locale: dateLocale })
                    : "-"}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.accountCreated")}</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {employee.created_at
                      ? format(new Date(employee.created_at), "PPP", { locale: dateLocale })
                      : "-"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">{t("hr.leaveStatus")}</p>
                {employee.is_on_leave ? (
                  <Badge className="bg-purple-500/10 text-purple-600">
                    {t("hr.onLeaveStatus")}
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-600">
                    {t("hr.working")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Information (if on leave) */}
        {employee.is_on_leave && (
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Calendar className="h-5 w-5" />
                {t("hr.currentLeave")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">{t("hr.startDate")}</p>
                  <p className="font-medium">
                    {employee.leave_start
                      ? format(new Date(employee.leave_start), "PPP", { locale: dateLocale })
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">{t("hr.endDate")}</p>
                  <p className="font-medium">
                    {employee.leave_end
                      ? format(new Date(employee.leave_end), "PPP", { locale: dateLocale })
                      : "-"}
                  </p>
                </div>
                {employee.leave_reason && (
                  <div className="space-y-1 md:col-span-3">
                    <p className="text-xs text-muted-foreground uppercase">{t("hr.reason")}</p>
                    <p className="font-medium">{employee.leave_reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default EmployeeProfile;
