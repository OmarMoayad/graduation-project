import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { clearInvalidAuthSessionIfNeeded } from "@/lib/auth-recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Package, CheckCircle2, Shield, Zap, Home } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    void clearInvalidAuthSessionIfNeeded();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: formData.fullName,
            },
          },
        });

        if (error) throw error;

        toast.success(t("hr.accountPending"));
        toast.info(t("hr.accountPendingDesc"));
        await supabase.auth.signOut({ scope: "local" });
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Check approval status
        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("approval_status, rejection_reason")
            .eq("id", authData.user.id)
            .single();

          if (profile?.approval_status === "pending") {
            await supabase.auth.signOut({ scope: "local" });
            toast.error(t("hr.accountPending"));
            toast.info(t("hr.accountPendingDesc"));
            return;
          }

          if (profile?.approval_status === "rejected") {
            await supabase.auth.signOut({ scope: "local" });
            toast.error(t("hr.accountRejected"));
            if (profile.rejection_reason) {
              toast.info(profile.rejection_reason);
            }
            return;
          }
        }

        toast.success(t("auth.welcomeBack"));
        navigate("/dashboard");
      }
    } catch (error: any) {
      const msg = String(error?.message ?? "").toLowerCase();
      const code = error?.code ?? "";

      // Handle broken persisted session
      if (
        code === "refresh_token_not_found" ||
        msg.includes("refresh token not found") ||
        msg.includes("invalid refresh token")
      ) {
        await clearInvalidAuthSessionIfNeeded();
        toast.error(t("auth.signInToContinue"));
        return;
      }

      // User already registered
      if (
        msg.includes("user already registered") ||
        msg.includes("already been registered") ||
        code === "user_already_exists"
      ) {
        toast.error(t("auth.userAlreadyRegistered"));
        return;
      }

      // Invalid credentials
      if (
        msg.includes("invalid login credentials") ||
        msg.includes("invalid password") ||
        code === "invalid_credentials"
      ) {
        toast.error(t("auth.invalidCredentials"));
        return;
      }

      toast.error(t("auth.authFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Top Bar - Language Switcher & Home Button */}
      <div className="absolute top-4 start-4 z-20 flex items-center gap-2">
        <LanguageSwitcher variant="outline" />
        <Button
          variant="outline"
          size="icon"
          asChild
          className="bg-background/80 backdrop-blur-sm"
        >
          <Link to="/">
            <Home className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-8 animate-fade-in">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-elegant">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight">Remix</h1>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              {t('login.heroSubtitle')}
            </p>
          </div>

          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('login.feature1')}</h3>
                <p className="text-white/80">{t('login.feature1')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('login.feature2')}</h3>
                <p className="text-white/80">{t('login.feature2')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('login.feature3')}</h3>
                <p className="text-white/80">{t('login.feature3')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-2 shadow-elegant">
            <CardHeader className="text-center pb-8">
              <div className="lg:hidden mx-auto w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold mb-2">
                {isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}
              </CardTitle>
              <CardDescription className="text-base">
                {isSignup ? t('auth.startJourney') : t('auth.signInToContinue')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <form onSubmit={handleAuth} className="space-y-5">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">{t('common.fullName')}</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required={isSignup}
                      className="h-11"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">{t('common.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-smooth shadow-lg text-base font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {isLoading 
                    ? (isSignup ? t('auth.creatingAccount') : t('auth.signingIn'))
                    : (isSignup ? t('common.signUp') : t('common.signIn'))
                  }
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignup ? (
                    <>{t('auth.haveAccount')} <span className="font-semibold text-primary">{t('common.signIn')}</span></>
                  ) : (
                    <>{t('auth.noAccount')} <span className="font-semibold text-primary">{t('common.signUp')}</span></>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
