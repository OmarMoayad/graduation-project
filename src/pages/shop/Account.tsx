import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ShoppingBag, User as UserIcon, LogOut, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { getShopOrganization } from "@/lib/shop-config";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadOrders(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadOrders(user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("id, order_number, status, total_amount, created_at")
        .eq("portal_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/shop/account`,
          data: {
            full_name: signupForm.fullName,
          },
        },
      });

      if (error) throw error;

      // Create portal user profile
      if (data.user) {
        const shopOrg = await getShopOrganization();

        if (shopOrg) {
          await supabase.from("portal_users").insert({
            id: data.user.id,
            organization_id: shopOrg.id,
            full_name: signupForm.fullName,
            email: signupForm.email,
          });
        } else {
          console.error("Shop organization not found for user signup");
        }
      }

      toast.success("Account created! Please check your email to verify.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
    toast.success("Signed out successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-500/10 text-yellow-600";
      case "confirmed":
        return "bg-blue-500/10 text-blue-600";
      case "shipped":
        return "bg-purple-500/10 text-purple-600";
      case "completed":
        return "bg-green-500/10 text-green-600";
      case "cancelled":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/shop" className="text-2xl font-bold text-primary">
              Shop
            </Link>
            {user && (
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/shop")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        {!user ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>My Account</CardTitle>
                <CardDescription>
                  Sign in to view your order history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={authMode}
                  onValueChange={(v) => setAuthMode(v as "login" | "signup")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Create Account</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginForm.email}
                          onChange={(e) =>
                            setLoginForm((p) => ({ ...p, email: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          value={signupForm.fullName}
                          onChange={(e) =>
                            setSignupForm((p) => ({
                              ...p,
                              fullName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupForm.email}
                          onChange={(e) =>
                            setSignupForm((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={signupForm.password}
                          onChange={(e) =>
                            setSignupForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          required
                          minLength={6}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.email}</h1>
                <p className="text-muted-foreground">Welcome back!</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order History
                </CardTitle>
                <CardDescription>
                  View your past orders and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      You haven't placed any orders yet.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/shop")}
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-mono font-semibold">
                            {order.order_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "PPP")}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="font-bold">
                            ${order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
