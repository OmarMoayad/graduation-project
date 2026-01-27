import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { clearInvalidAuthSessionIfNeeded } from "@/lib/auth-recovery";
import {
  Box,
  LogOut,
  ChevronDown,
  Home,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("");
  const isDashboard = location.pathname === "/dashboard";

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        await clearInvalidAuthSessionIfNeeded();
        navigate("/login");
        return;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      // Check approval status
      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("id", user.id)
        .single();

      if (profile?.approval_status !== "approved") {
        await supabase.auth.signOut({ scope: "local" });
        navigate("/login");
        return;
      }

      const email = user.email || "";
      const name = email.split("@")[0];
      setUserName(name);
    } catch {
      await clearInvalidAuthSessionIfNeeded();
      navigate("/login");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t('common.signOut'));
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-background w-full">
      {/* Top App Bar */}
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {!isDashboard && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="h-8 w-8"
              >
                <Home className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                  <Box className="h-3 w-3 text-white" />
                </div>
                <h1 className="font-semibold text-sm">Remix</h1>
              </div>
            </>
          )}
        </div>

        {/* Language Switcher & User Menu */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8">
                <span className="text-xs text-muted-foreground">{userName}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-popover">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="me-2 h-4 w-4" />
                {t('profile.myProfile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="me-2 h-4 w-4" />
                {t('common.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/30">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
