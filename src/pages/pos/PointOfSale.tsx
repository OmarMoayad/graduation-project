import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import SessionsView from "./SessionsView";
import OrdersView from "./OrdersView";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface POSSession {
  id: string;
  session_number: string;
  status: string;
  start_time: string;
  user_id: string;
  user_name?: string;
}

export default function PointOfSale() {
  const navigate = useNavigate();
  const [organizationId, setOrganizationId] = useState("");
  const [sessions, setSessions] = useState<POSSession[]>([]);
  const [activeTab, setActiveTab] = useState("sessions-cards");

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadSessions();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
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

  const loadSessions = async () => {
    const { data: sessionData } = await supabase
      .from("pos_sessions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("start_time", { ascending: false })
      .limit(20);

    if (sessionData) {
      // Get unique user IDs
      const userIds = [...new Set(sessionData.map(s => s.user_id))];

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Map profiles to sessions
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const sessionsWithUsers = sessionData.map(session => ({
        ...session,
        user_name: profileMap.get(session.user_id) || "Unknown",
      }));

      setSessions(sessionsWithUsers);
    }
  };

  const handleOpenSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const sessionNumber = `POS/${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

      const { data: newSession, error } = await supabase
        .from("pos_sessions")
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          session_number: sessionNumber,
          opening_balance: 0,
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("New session opened");
      navigate(`/pos/session/${newSession.id}/sell`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleContinueSelling = (sessionId: string) => {
    navigate(`/pos/session/${sessionId}/sell`);
  };

  const handleCloseSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("pos_sessions")
        .update({
          status: "closed",
          end_time: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session closed");
      loadSessions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Point of Sale</h1>
          <Button onClick={handleOpenSession} size="lg">
            Open New Session
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sessions-cards">Sessions</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions-cards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <Card key={session.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {session.session_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {session.user_name}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/pos/session/${session.id}/orders`)}
                        >
                          View Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setActiveTab("sessions-list")}
                        >
                          View All Sessions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4">
                    <Badge
                      variant={session.status === "open" ? "destructive" : "secondary"}
                    >
                      {session.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </div>

                  {session.status === "open" ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-[#17A2B8] hover:bg-[#138496]"
                        onClick={() => handleContinueSelling(session.id)}
                      >
                        CONTINUE SELLING
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCloseSession(session.id)}
                      >
                        Close Session
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/pos/session/${session.id}/orders`)}
                    >
                      View Orders
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <OrdersView />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
