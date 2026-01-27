import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Inbox, Send, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import ComposeMessageDialog from "@/components/messaging/ComposeMessageDialog";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  parent_id: string | null;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

const Messages = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("inbox");
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [currentUserId, activeTab]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from("messages").select("*").order("created_at", { ascending: false });

    if (activeTab === "inbox") {
      query = query.eq("recipient_id", user.id);
    } else {
      query = query.eq("sender_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error(t("messages.loadFailed"));
    } else if (data) {
      // Load profile names
      const userIds = [...new Set(data.flatMap(m => [m.sender_id, m.recipient_id]))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach(p => {
        profileMap[p.id] = p.full_name || p.email || p.id;
      });
      setProfiles(profileMap);

      setMessages(data.map(m => ({
        ...m,
        sender_name: profileMap[m.sender_id],
        recipient_name: profileMap[m.recipient_id],
      })));
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (message: Message) => {
    if (!message.is_read && message.recipient_id === currentUserId) {
      await supabase.from("messages").update({ is_read: true }).eq("id", message.id);
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    markAsRead(message);
  };

  const handleReply = () => {
    if (selectedMessage) {
      setReplyTo({
        id: selectedMessage.id,
        sender_id: selectedMessage.sender_id,
        sender_name: selectedMessage.sender_name,
        subject: selectedMessage.subject || "",
      });
      setComposeOpen(true);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read && m.recipient_id === currentUserId).length;
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">{t("messages.title")}</h2>
            <p className="text-muted-foreground">{t("messages.subtitle")}</p>
          </div>
          
          <Button onClick={() => { setReplyTo(null); setComposeOpen(true); }} className="bg-gradient-primary">
            <Plus className="me-2 h-4 w-4" />
            {t("messages.compose")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <Card className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="inbox" className="gap-2">
                  <Inbox className="h-4 w-4" />
                  {t("messages.inbox")}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ms-1">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-2">
                  <Send className="h-4 w-4" />
                  {t("messages.sent")}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px]">
                <div className="p-2 space-y-1">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      {t("messages.noMessages")}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleSelectMessage(message)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        } ${!message.is_read && activeTab === "inbox" ? "bg-accent/50" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          {!message.is_read && activeTab === "inbox" ? (
                            <Mail className="h-4 w-4 mt-1 text-primary" />
                          ) : (
                            <MailOpen className="h-4 w-4 mt-1 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium truncate ${!message.is_read && activeTab === "inbox" ? "font-bold" : ""}`}>
                                {activeTab === "inbox" ? message.sender_name : message.recipient_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: dateLocale })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {message.subject || t("messages.noSubject")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {message.body.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </Card>

          {/* Message Detail */}
          <Card className="lg:col-span-2 p-6">
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedMessage.subject || t("messages.noSubject")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "inbox" ? t("messages.from") : t("messages.to")}: {activeTab === "inbox" ? selectedMessage.sender_name : selectedMessage.recipient_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedMessage.created_at).toLocaleString(i18n.language === "ar" ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                  {activeTab === "inbox" && (
                    <Button onClick={handleReply} size="sm">
                      <Reply className="me-2 h-4 w-4" />
                      {t("messages.reply")}
                    </Button>
                  )}
                </div>
                <Separator />
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedMessage.body}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("messages.selectMessage")}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ComposeMessageDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        replyTo={replyTo}
      />
    </AppLayout>
  );
};

export default Messages;
