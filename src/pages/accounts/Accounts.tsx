import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package,
  Building2,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface BranchSummary {
  id: string;
  name: string;
  name_ar: string | null;
  sales_total: number;
  purchases_total: number;
  salary_total: number;
  employees_count: number;
}

interface FinancialSummary {
  total_sales: number;
  total_purchases: number;
  total_salaries: number;
  total_employees: number;
  total_products: number;
  gross_profit: number;
  branches: BranchSummary[];
}

const Accounts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [summary, setSummary] = useState<FinancialSummary>({
    total_sales: 0,
    total_purchases: 0,
    total_salaries: 0,
    total_employees: 0,
    total_products: 0,
    gross_profit: 0,
    branches: [],
  });
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadAllData();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadFinancialSummary(),
      loadSalesOrders(),
      loadPurchaseOrders(),
      loadEmployees(),
    ]);
    setLoading(false);
  };

  const loadFinancialSummary = async () => {
    // Load branches
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name, name_ar, warehouse_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    // Load sales orders
    const { data: salesData } = await supabase
      .from("sales_orders")
      .select("total_amount")
      .eq("organization_id", organizationId);

    // Load purchase orders
    const { data: purchasesData } = await supabase
      .from("purchase_orders")
      .select("total_amount")
      .eq("organization_id", organizationId);

    // Load employees (profiles)
    const { data: employeesData } = await supabase
      .from("profiles")
      .select("id, salary, branch_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    // Load products count
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    // Calculate totals
    const totalSales = salesData?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    const totalPurchases = purchasesData?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
    const totalSalaries = employeesData?.reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0;

    // Calculate per branch
    const branchSummaries: BranchSummary[] = (branches || []).map(branch => {
      const branchEmployees = employeesData?.filter(e => e.branch_id === branch.id) || [];
      const branchSalaryTotal = branchEmployees.reduce((sum, e) => sum + Number(e.salary || 0), 0);
      
      return {
        id: branch.id,
        name: branch.name,
        name_ar: branch.name_ar,
        sales_total: 0, // Could be linked via branch warehouse if needed
        purchases_total: 0,
        salary_total: branchSalaryTotal,
        employees_count: branchEmployees.length,
      };
    });

    setSummary({
      total_sales: totalSales,
      total_purchases: totalPurchases,
      total_salaries: totalSalaries,
      total_employees: employeesData?.length || 0,
      total_products: productsCount || 0,
      gross_profit: totalSales - totalPurchases,
      branches: branchSummaries,
    });
  };

  const loadSalesOrders = async () => {
    const { data } = await supabase
      .from("sales_orders")
      .select("id, order_number, total_amount, status, created_at, guest_name, first_name, last_name")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(20);

    setSalesOrders(data || []);
  };

  const loadPurchaseOrders = async () => {
    const { data } = await supabase
      .from("purchase_orders")
      .select(`
        id, 
        order_number, 
        total_amount, 
        status, 
        order_date,
        vendor:contacts(name)
      `)
      .eq("organization_id", organizationId)
      .order("order_date", { ascending: false })
      .limit(20);

    setPurchaseOrders(data || []);
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        position,
        department,
        salary,
        branch:branches(name, name_ar)
      `)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("full_name");

    setEmployees(data || []);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-PS", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      draft: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      received: "bg-green-100 text-green-800",
      confirmed: "bg-blue-100 text-blue-800",
    };
    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">الحسابات المالية</h1>
            <p className="text-muted-foreground">نظرة شاملة على الوضع المالي للشركة</p>
          </div>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="جميع الفروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفروع</SelectItem>
              {summary.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name_ar || branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                إجمالي المبيعات
              </CardTitle>
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(summary.total_sales)}
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                إيرادات
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                إجمالي المشتريات
              </CardTitle>
              <div className="p-2 bg-red-500 rounded-lg">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(summary.total_purchases)}
              </div>
              <div className="flex items-center text-xs text-red-600 mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                مصروفات
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                إجمالي الرواتب
              </CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(summary.total_salaries)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {summary.total_employees} موظف
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${summary.gross_profit >= 0 ? 'from-emerald-50 to-teal-50 border-emerald-200' : 'from-orange-50 to-amber-50 border-orange-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${summary.gross_profit >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>
                صافي الربح
              </CardTitle>
              <div className={`p-2 ${summary.gross_profit >= 0 ? 'bg-emerald-500' : 'bg-orange-500'} rounded-lg`}>
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.gross_profit >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                {formatCurrency(summary.gross_profit)}
              </div>
              <div className={`text-xs ${summary.gross_profit >= 0 ? 'text-emerald-600' : 'text-orange-600'} mt-1`}>
                المبيعات - المشتريات
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branch Summary */}
        {summary.branches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                ملخص الفروع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.branches.map((branch) => (
                  <Card key={branch.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">{branch.name_ar || branch.name}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الموظفين:</span>
                          <span className="font-medium">{branch.employees_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">إجمالي الرواتب:</span>
                          <span className="font-medium">{formatCurrency(branch.salary_total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              المبيعات
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              المشتريات
            </TabsTrigger>
            <TabsTrigger value="salaries" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              الرواتب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>آخر طلبات المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>
                          {order.guest_name || `${order.first_name || ""} ${order.last_name || ""}`.trim() || "-"}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ar })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>آخر طلبات الشراء</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>{(order.vendor as any)?.name || "-"}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.total_amount || 0)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {format(new Date(order.order_date), "dd/MM/yyyy", { locale: ar })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salaries">
            <Card>
              <CardHeader>
                <CardTitle>رواتب الموظفين</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>المنصب</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>الراتب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name || "-"}</TableCell>
                        <TableCell>{emp.position || "-"}</TableCell>
                        <TableCell>{emp.department || "-"}</TableCell>
                        <TableCell>
                          {(emp.branch as any)?.name_ar || (emp.branch as any)?.name || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.salary ? formatCurrency(emp.salary) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Accounts;
