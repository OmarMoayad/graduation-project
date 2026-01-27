import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Session {
  id: string;
  session_number: string;
  start_time: string;
  end_time: string | null;
  status: string;
  opening_balance: number;
  closing_balance: number | null;
  user_id: string;
  user_name?: string;
}

export default function SessionsView() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [organizationId, setOrganizationId] = useState("");

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
    if (!user) return;

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
      .order("start_time", { ascending: false });

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

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session ID</TableHead>
            <TableHead>Opened By</TableHead>
            <TableHead>Opening Date</TableHead>
            <TableHead>Closing Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow 
              key={session.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/pos/session/${session.id}/orders`)}
            >
              <TableCell className="font-medium">{session.session_number}</TableCell>
              <TableCell>{session.user_name}</TableCell>
              <TableCell>
                {format(new Date(session.start_time), "dd/MM/yyyy HH:mm:ss")}
              </TableCell>
              <TableCell>
                {session.end_time
                  ? format(new Date(session.end_time), "dd/MM/yyyy HH:mm:ss")
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={session.status === "open" ? "default" : "secondary"}
                >
                  {session.status === "open" ? "In Progress" : "Closed & Posted"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
