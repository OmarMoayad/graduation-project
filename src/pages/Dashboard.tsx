import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { useModuleAccess } from "@/hooks/use-module-access";
import {
  TrendingUp,
  Settings,
  CreditCard,
  Store,
  Loader2,
  ShoppingCart,
  Receipt,
  MessageSquareMore,
  Users,
  Warehouse,
  Mail,
  Sparkles,
  Clock,
  Calendar,
  Calculator,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { loading: permsLoading, canReadModule } = useModuleAccess();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isRTL = i18n.language === "ar";
  const dateLocale = isRTL ? ar : enUS;

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    loadUnreadMessages();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    }
  };

  const loadUnreadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    setUnreadMessages(count || 0);
  };

  const modules = useMemo(
    () =>
      [
        {
          moduleName: "inventory",
          icon: Warehouse,
          label: t("modules.warehouses"),
          path: "/inventory",
          gradient: "from-rose-500 to-pink-600",
          shadow: "shadow-rose-500/30",
        },
        {
          moduleName: "purchases",
          icon: CreditCard,
          label: t("modules.purchases"),
          path: "/purchases",
          gradient: "from-cyan-500 to-blue-600",
          shadow: "shadow-cyan-500/30",
        },
        {
          moduleName: "pos",
          icon: Store,
          label: t("modules.pos"),
          path: "/pos",
          gradient: "from-slate-500 to-slate-700",
          shadow: "shadow-slate-500/30",
        },
        {
          moduleName: "sales",
          icon: Receipt,
          label: t("modules.sales"),
          path: "/sales",
          gradient: "from-violet-500 to-purple-600",
          shadow: "shadow-violet-500/30",
        },
        {
          moduleName: "ecommerce",
          icon: ShoppingCart,
          label: t("modules.ecommerce"),
          path: "/shop-admin",
          gradient: "from-emerald-500 to-green-600",
          shadow: "shadow-emerald-500/30",
        },
        {
          moduleName: "inquiries",
          icon: MessageSquareMore,
          label: t("modules.inquiries"),
          path: "/inquiries",
          gradient: "from-orange-500 to-amber-600",
          shadow: "shadow-orange-500/30",
        },
        {
          moduleName: "hr",
          icon: Users,
          label: t("modules.hr"),
          path: "/hr",
          gradient: "from-blue-500 to-indigo-600",
          shadow: "shadow-blue-500/30",
        },
        {
          moduleName: "reports",
          icon: TrendingUp,
          label: t("modules.reports"),
          path: "/reports",
          gradient: "from-amber-500 to-orange-600",
          shadow: "shadow-amber-500/30",
        },
        {
          moduleName: "accounts",
          icon: Calculator,
          label: t("modules.accounts"),
          path: "/accounts",
          gradient: "from-teal-500 to-cyan-600",
          shadow: "shadow-teal-500/30",
        },
        {
          moduleName: "settings",
          icon: Settings,
          label: t("modules.settings"),
          path: "/settings",
          gradient: "from-gray-500 to-zinc-600",
          shadow: "shadow-gray-500/30",
        },
      ] as const,
    [t]
  );

  const visibleModules = useMemo(
    () => modules.filter((m) => canReadModule(m.moduleName)),
    [modules, canReadModule]
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        {/* Messages Button - Fixed Position */}
        <Button
          onClick={() => navigate("/messages")}
          variant="ghost"
          size="icon"
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full h-12 w-12 shadow-lg border border-white/20 transition-all hover:scale-110 z-10`}
        >
          <Mail className="h-5 w-5 text-white" />
          {unreadMessages > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </Badge>
          )}
        </Button>

        {permsLoading ? (
          <div className="flex items-center justify-center p-8 z-10">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
        ) : visibleModules.length === 0 ? (
          <div className="max-w-lg text-center z-10">
            <img src={logo} alt="Logo" className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-2xl ring-4 ring-white/20" />
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-white/70">
              {t("dashboard.noModules")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center z-10 animate-fade-in">
            {/* Logo with Glow Effect */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
              <img 
                src={logo} 
                alt="Flow Smart" 
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl shadow-2xl ring-4 ring-white/30 transition-all hover:scale-105 hover:ring-white/50"
              />
            </div>

            {/* Date & Time Display */}
            <div className="flex items-center gap-6 mb-8 px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">{isRTL ? 'التاريخ' : 'Date'}</p>
                  <p className="text-white font-semibold">
                    {format(currentTime, "EEEE, d MMMM yyyy", { locale: dateLocale })}
                  </p>
                </div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">{isRTL ? 'الوقت' : 'Time'}</p>
                  <p className="text-white font-semibold font-mono text-xl">
                    {format(currentTime, "hh:mm:ss a", { locale: dateLocale })}
                  </p>
                </div>
              </div>
            </div>

            {/* Welcome Text with Gradient */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">
                  Remix ERP
                </span>
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-3">
                {t("dashboard.welcome")}
              </h1>
              <p className="text-white/60 text-lg">
                {t("dashboard.selectModule")}
              </p>
            </div>

            {/* Modules Grid with Enhanced Cards */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 justify-items-center max-w-4xl">
              {visibleModules.map((module, index) => (
                <div
                  key={module.path}
                  className="cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 flex flex-col items-center group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => navigate(module.path)}
                >
                  <div
                    className={`bg-gradient-to-br ${module.gradient} p-5 md:p-6 rounded-2xl shadow-xl ${module.shadow} w-18 h-18 md:w-22 md:h-22 flex items-center justify-center mb-3 group-hover:shadow-2xl transition-all duration-300 border border-white/10 backdrop-blur-sm relative overflow-hidden`}
                  >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12" />
                    <module.icon className="h-7 w-7 md:h-9 md:w-9 text-white relative z-10 drop-shadow-lg" />
                  </div>
                  <h3 className="font-semibold text-xs md:text-sm text-white/90 text-center drop-shadow-lg group-hover:text-white transition-colors">
                    {module.label}
                  </h3>
                </div>
              ))}
            </div>

            {/* Messages Quick Access Button */}
            <div className="mt-12">
              <Button
                onClick={() => navigate("/messages")}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-purple-500/30 px-8 py-6 text-lg rounded-2xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40"
              >
                <Mail className="me-3 h-5 w-5" />
                {t("messages.title")}
                {unreadMessages > 0 && (
                  <Badge className="ms-3 bg-white/20 hover:bg-white/30 border-0">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;

