import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MessageSquare, Mail, Phone, Calendar, Eye, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

// Helper to query the inquiries table (not yet in generated types)
const queryInquiries = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("inquiries");
};

const Inquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const { data, error } = await queryInquiries()
        .select("id, name, email, phone, subject, message, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries((data || []) as Inquiry[]);
    } catch (error) {
      console.error("Error loading inquiries:", error);
      toast.error("فشل في تحميل الاستفسارات");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await queryInquiries()
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      setInquiries(prev => 
        prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq)
      );
      
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      toast.success("تم تحديث الحالة");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("فشل في تحديث الحالة");
    }
  };

  const filteredInquiries = inquiries.filter(inq =>
    inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inq.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">قيد الانتظار</Badge>;
      case "read":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">مقروء</Badge>;
      case "resolved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">تم الحل</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">الاستفسارات</h1>
            <p className="text-muted-foreground">إدارة استفسارات العملاء والزوار</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredInquiries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد استفسارات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInquiries.map((inquiry) => (
              <Card 
                key={inquiry.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedInquiry(inquiry);
                  if (inquiry.status === "pending") {
                    updateStatus(inquiry.id, "read");
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{inquiry.subject}</h3>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {inquiry.name}
                        </span>
                        {inquiry.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {inquiry.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(inquiry.created_at), "dd MMM yyyy", { locale: ar })}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 ml-2" />
                      عرض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Inquiry Detail Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
            </DialogHeader>
            
            {selectedInquiry && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedInquiry.status)}
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedInquiry.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-muted-foreground">الاسم</label>
                    <p>{selectedInquiry.name}</p>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground">البريد الإلكتروني</label>
                    <p>{selectedInquiry.email}</p>
                  </div>
                  {selectedInquiry.phone && (
                    <div>
                      <label className="font-medium text-muted-foreground">الهاتف</label>
                      <p>{selectedInquiry.phone}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-medium text-muted-foreground">الرسالة</label>
                  <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedInquiry.status !== "resolved" && (
                    <Button 
                      onClick={() => updateStatus(selectedInquiry.id, "resolved")}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      تم الحل
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`mailto:${selectedInquiry.email}`)}
                  >
                    <Mail className="h-4 w-4 ml-2" />
                    رد بالبريد
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Inquiries;
