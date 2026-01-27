import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  UserCheck,
  Briefcase,
  DollarSign,
  AlertCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building,
  KeyRound,
  Search,
  User,
  Edit,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import EditSalaryDialog from "@/components/hr/EditSalaryDialog";

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
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
  employee?: { full_name: string; email: string };
}

const HumanResources = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";
  const dateLocale = isRTL ? ar : enUS;

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingApprovals, setPendingApprovals] = useState<Employee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [salaryEmployee, setSalaryEmployee] = useState<{ id: string; full_name: string; salary: number | null } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [employeeToReject, setEmployeeToReject] = useState<Employee | null>(null);
  const [processing, setProcessing] = useState(false);

  const [editForm, setEditForm] = useState({
    position: "",
    department: "",
    salary: "",
    salary_currency: "ILS" as "ILS" | "USD" | "JOD",
    hire_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      // Fetch pending approvals - get ALL pending users regardless of organization
      const { data: pending } = await supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "pending")
        .neq("id", user.id);

      setPendingApprovals((pending as Employee[]) || []);

      // Fetch approved employees
      const { data: approved } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("approval_status", "approved");

      setEmployees((approved as Employee[]) || []);

      // Fetch leave requests
      const { data: leaves } = await supabase
        .from("employee_leave_requests")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      setLeaveRequests(leaves || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t("hr.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (employee: Employee) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get admin's organization_id
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          organization_id: adminProfile?.organization_id, // Transfer to admin's organization
          is_active: true,
        })
        .eq("id", employee.id);

      if (error) throw error;

      toast.success(t("hr.approvedSuccess"));
      fetchData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error(t("hr.approveFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (employee: Employee) => {
    setEmployeeToReject(employee);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!employeeToReject) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", employeeToReject.id);

      if (error) throw error;

      toast.success(t("hr.rejectedSuccess"));
      setIsRejectDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error(t("hr.rejectFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      position: employee.position || "",
      department: employee.department || "",
      salary: employee.salary?.toString() || "",
      salary_currency: "ILS",
      hire_date: employee.hire_date || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          position: editForm.position || null,
          department: editForm.department || null,
          salary: editForm.salary ? parseFloat(editForm.salary) : null,
          hire_date: editForm.hire_date || null,
        })
        .eq("id", selectedEmployee.id);

      if (error) throw error;

      toast.success(t("hr.updateSuccess"));
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(t("hr.updateFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleLeaveAction = async (leaveId: string, action: "approved" | "rejected") => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("employee_leave_requests")
        .update({
          status: action,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", leaveId);

      if (error) throw error;

      toast.success(action === "approved" ? t("hr.leaveApproved") : t("hr.leaveRejected"));
      fetchData();
    } catch (error) {
      console.error("Error updating leave:", error);
      toast.error(t("hr.leaveActionFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{t("hr.approved")}</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">{t("hr.rejected")}</Badge>;
      case "pending":
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{t("hr.pending")}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      annual: "bg-blue-500/10 text-blue-600",
      sick: "bg-red-500/10 text-red-600",
      unpaid: "bg-gray-500/10 text-gray-600",
      emergency: "bg-orange-500/10 text-orange-600",
      other: "bg-purple-500/10 text-purple-600",
    };
    return <Badge className={colors[type] || colors.other}>{t(`hr.leaveTypes.${type}`)}</Badge>;
  };

  const pendingLeavesCount = leaveRequests.filter(l => l.status === "pending").length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("hr.title")}</h1>
            <p className="text-muted-foreground">{t("hr.subtitle")}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("hr.pendingApprovals")}</p>
                  <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("hr.totalEmployees")}</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("hr.onLeave")}</p>
                  <p className="text-2xl font-bold">{employees.filter(e => e.is_on_leave).length}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("hr.pendingLeaves")}</p>
                  <p className="text-2xl font-bold">{pendingLeavesCount}</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="approvals" className="space-y-4">
            <TabsList>
              <TabsTrigger value="approvals" className="gap-2">
                <UserCheck className="h-4 w-4" />
                {t("hr.accountApprovals")}
                {pendingApprovals.length > 0 && (
                  <Badge variant="destructive" className="ms-1">{pendingApprovals.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="employees" className="gap-2">
                <Users className="h-4 w-4" />
                {t("hr.employeesList")}
              </TabsTrigger>
              <TabsTrigger value="leaves" className="gap-2">
                <Calendar className="h-4 w-4" />
                {t("hr.leaveRequests")}
                {pendingLeavesCount > 0 && (
                  <Badge variant="destructive" className="ms-1">{pendingLeavesCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Pending Account Approvals */}
            <TabsContent value="approvals">
              <Card>
                <CardHeader>
                  <CardTitle>{t("hr.pendingAccountApprovals")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingApprovals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("hr.noPendingApprovals")}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.name")}</TableHead>
                          <TableHead>{t("common.email")}</TableHead>
                          <TableHead>{t("hr.requestDate")}</TableHead>
                          <TableHead>{t("common.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovals.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.full_name}</TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>
                              {employee.created_at && format(new Date(employee.created_at), "PPP", { locale: dateLocale })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(employee)}
                                  disabled={processing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 me-1" />
                                  {t("hr.approve")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectDialog(employee)}
                                  disabled={processing}
                                >
                                  <XCircle className="h-4 w-4 me-1" />
                                  {t("hr.reject")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employees List */}
            <TabsContent value="employees">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>{t("hr.employeesInfo")}</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("hr.searchEmployees")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {employees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("hr.noEmployees")}</p>
                    </div>
                  ) : (
                    <>
                      {/* Employee Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {employees
                          .filter((emp) =>
                            emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((employee) => (
                            <Card
                              key={employee.id}
                              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                              onClick={() => navigate(`/hr/employee/${employee.id}`)}
                            >
                              <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-14 w-14">
                                    <AvatarImage src={employee.avatar_url || ""} alt={employee.full_name} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                      {employee.full_name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2) || <User className="h-6 w-6" />}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base truncate">{employee.full_name}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {employee.position && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Briefcase className="h-3 w-3 me-1" />
                                          {employee.position}
                                        </Badge>
                                      )}
                                      {employee.is_on_leave ? (
                                        <Badge className="bg-purple-500/10 text-purple-600 text-xs">
                                          {t("hr.onLeaveStatus")}
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-green-500/10 text-green-600 text-xs">
                                          {t("hr.working")}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                  <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                                    <div>
                                      <p className="text-muted-foreground text-xs">{t("hr.department")}</p>
                                      <p className="font-medium truncate">{employee.department || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground text-xs">{t("hr.salary")}</p>
                                      <p className="font-medium">
                                        {employee.salary ? `${employee.salary.toLocaleString()}` : "-"}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSalaryEmployee({
                                        id: employee.id,
                                        full_name: employee.full_name,
                                        salary: employee.salary,
                                      });
                                      setIsSalaryDialogOpen(true);
                                    }}
                                  >
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                      {employees.filter((emp) =>
                        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>{t("hr.noSearchResults")}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leave Requests */}
            <TabsContent value="leaves">
              <Card>
                <CardHeader>
                  <CardTitle>{t("hr.leaveRequestsTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {leaveRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("hr.noLeaveRequests")}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("hr.leaveType")}</TableHead>
                          <TableHead>{t("hr.startDate")}</TableHead>
                          <TableHead>{t("hr.endDate")}</TableHead>
                          <TableHead>{t("hr.reason")}</TableHead>
                          <TableHead>{t("common.status")}</TableHead>
                          <TableHead>{t("common.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveRequests.map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                            <TableCell>{format(new Date(leave.start_date), "PP", { locale: dateLocale })}</TableCell>
                            <TableCell>{format(new Date(leave.end_date), "PP", { locale: dateLocale })}</TableCell>
                            <TableCell className="max-w-xs truncate">{leave.reason || "-"}</TableCell>
                            <TableCell>{getStatusBadge(leave.status)}</TableCell>
                            <TableCell>
                              {leave.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleLeaveAction(leave.id, "approved")}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleLeaveAction(leave.id, "rejected")}
                                    disabled={processing}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("hr.editEmployee")}</DialogTitle>
              <DialogDescription>{selectedEmployee?.full_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("hr.position")}</Label>
                <Input
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder={t("hr.positionPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("hr.department")}</Label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  placeholder={t("hr.departmentPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("hr.salary")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editForm.salary}
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <Select 
                    value={editForm.salary_currency} 
                    onValueChange={(val: "ILS" | "USD" | "JOD") => setEditForm({ ...editForm, salary_currency: val })}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ILS">₪ ILS</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="JOD">د.أ JOD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("hr.hireDate")}</Label>
                <Input
                  type="date"
                  value={editForm.hire_date}
                  onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdateEmployee} disabled={processing}>
                {processing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Employee Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("hr.employeeDetails")}
              </DialogTitle>
              <DialogDescription>{selectedEmployee?.full_name}</DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    {selectedEmployee.avatar_url ? (
                      <img 
                        src={selectedEmployee.avatar_url} 
                        alt={selectedEmployee.full_name} 
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedEmployee.full_name}</h3>
                    <p className="text-muted-foreground">{selectedEmployee.position || t("hr.noPosition")}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {t("hr.contactInfo")}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                          <p className="font-medium">{selectedEmployee.email || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("hr.phone")}</p>
                          <p className="font-medium">{selectedEmployee.phone || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("hr.password")}</p>
                          <p className="font-medium text-muted-foreground italic">
                            {t("hr.passwordEncrypted")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {t("hr.workInfo")}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("hr.position")}</p>
                          <p className="font-medium">{selectedEmployee.position || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("hr.department")}</p>
                          <p className="font-medium">{selectedEmployee.department || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("hr.salary")}</p>
                          <p className="font-medium">
                            {selectedEmployee.salary ? selectedEmployee.salary.toLocaleString() : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">{t("hr.hireDate")}</p>
                    <p className="font-medium">
                      {selectedEmployee.hire_date 
                        ? format(new Date(selectedEmployee.hire_date), "PP", { locale: dateLocale })
                        : "-"}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">{t("hr.accountCreated")}</p>
                    <p className="font-medium">
                      {selectedEmployee.created_at 
                        ? format(new Date(selectedEmployee.created_at), "PP", { locale: dateLocale })
                        : "-"}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">{t("hr.leaveStatus")}</p>
                    {selectedEmployee.is_on_leave ? (
                      <Badge className="bg-purple-500/10 text-purple-600 mt-1">
                        {t("hr.onLeaveStatus")}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 mt-1">
                        {t("hr.working")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Leave Info (if on leave) */}
                {selectedEmployee.is_on_leave && (
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <h4 className="font-medium mb-2">{t("hr.currentLeave")}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("hr.startDate")}</p>
                        <p className="font-medium">
                          {selectedEmployee.leave_start 
                            ? format(new Date(selectedEmployee.leave_start), "PP", { locale: dateLocale })
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("hr.endDate")}</p>
                        <p className="font-medium">
                          {selectedEmployee.leave_end 
                            ? format(new Date(selectedEmployee.leave_end), "PP", { locale: dateLocale })
                            : "-"}
                        </p>
                      </div>
                      {selectedEmployee.leave_reason && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">{t("hr.reason")}</p>
                          <p className="font-medium">{selectedEmployee.leave_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                {t("common.close")}
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedEmployee) openEditDialog(selectedEmployee);
              }}>
                {t("common.edit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("hr.rejectAccount")}</DialogTitle>
              <DialogDescription>{employeeToReject?.full_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("hr.rejectionReason")}</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("hr.rejectionReasonPlaceholder")}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                {processing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("hr.confirmReject")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Salary Edit Dialog */}
        <EditSalaryDialog
          open={isSalaryDialogOpen}
          onOpenChange={setIsSalaryDialogOpen}
          employee={salaryEmployee}
          onSuccess={fetchData}
        />
      </div>
    </AppLayout>
  );
};

export default HumanResources;
