import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_id: string | null;
  created_by: string;
  customer_name?: string;
  creator_name?: string;
}

export default function OrdersView() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadOrders();
    }
  }, [organizationId, sessionId]);

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

  const loadOrders = async () => {
    let query = supabase
      .from("pos_orders")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data: orderData } = await query;

    if (orderData) {
      // Get unique user and customer IDs
      const userIds = [...new Set(orderData.map(o => o.created_by))];
      const customerIds = orderData
        .filter(o => o.customer_id)
        .map(o => o.customer_id as string);

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Fetch customer names
      const { data: customers } = customerIds.length > 0
        ? await supabase
            .from("contacts")
            .select("id, name")
            .in("id", customerIds)
        : { data: [] };

      // Create maps
      const profileMap = new Map<string, string>(
        profiles?.map(p => [p.id, p.full_name] as [string, string]) || []
      );
      const customerMap = new Map<string, string>(
        customers?.map(c => [c.id, c.name] as [string, string]) || []
      );

      const ordersWithNames: Order[] = orderData.map(order => ({
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        total_amount: order.total_amount,
        status: order.status,
        customer_id: order.customer_id,
        created_by: order.created_by,
        creator_name: profileMap.get(order.created_by) || "Unknown",
        customer_name: order.customer_id ? (customerMap.get(order.customer_id) || "-") : "-",
      }));

      setOrders(ordersWithNames);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Ref</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow 
              key={order.id}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>
                {format(new Date(order.created_at), "dd/MM/yyyy HH:mm:ss")}
              </TableCell>
              <TableCell>{order.customer_name || "-"}</TableCell>
              <TableCell>{order.creator_name}</TableCell>
              <TableCell>₪ {order.total_amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant="default">
                  {order.status === "paid" ? "Paid" : order.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
