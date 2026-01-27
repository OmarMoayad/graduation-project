import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2, Building2, Users, User, Search } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  branch_id: string | null;
  position: string | null;
}

interface Branch {
  id: string;
  name: string;
  name_ar: string | null;
}

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    id: string;
    sender_id: string;
    sender_name: string;
    subject: string;
  };
  preselectedRecipient?: string;
}

const ComposeMessageDialog = ({
  open,
  onOpenChange,
  replyTo,
  preselectedRecipient,
}: ComposeMessageDialogProps) => {
  const { t, i18n } = useTranslation();
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    recipient_id: preselectedRecipient || "",
    subject: "",
    body: "",
  });

  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (open) {
      loadData();
      if (replyTo) {
        setFormData({
          recipient_id: replyTo.sender_id,
          subject: replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
          body: "",
        });
      } else if (preselectedRecipient) {
        setFormData(prev => ({ ...prev, recipient_id: preselectedRecipient }));
      }
    } else {
      // Reset filters when dialog closes
      setSelectedBranch("");
      setSelectedDepartment("");
      setSearchQuery("");
    }
  }, [open, replyTo, preselectedRecipient]);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      // Load users and branches in parallel
      const [usersResult, branchesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, department, branch_id, position")
          .eq("organization_id", profile.organization_id)
          .eq("approval_status", "approved")
          .neq("id", user.id),
        supabase
          .from("branches")
          .select("id, name, name_ar")
          .eq("organization_id", profile.organization_id)
          .eq("is_active", true)
      ]);

      if (!usersResult.error && usersResult.data) {
        setAllUsers(usersResult.data);
      }
      if (!branchesResult.error && branchesResult.data) {
        setBranches(branchesResult.data);
      }
    }
    setLoading(false);
  };

  // Get unique departments from users
  const departments = useMemo(() => {
    const depts = new Set<string>();
    allUsers.forEach(user => {
      if (user.department) {
        depts.add(user.department);
      }
    });
    return Array.from(depts).sort();
  }, [allUsers]);

  // Filter users based on branch, department and search
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesBranch = !selectedBranch || selectedBranch === "all" || user.branch_id === selectedBranch;
      const matchesDepartment = !selectedDepartment || selectedDepartment === "all" || user.department === selectedDepartment;
      const matchesSearch = !searchQuery || 
        (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.position?.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesBranch && matchesDepartment && matchesSearch;
    });
  }, [allUsers, selectedBranch, selectedDepartment, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipient_id || !formData.body) {
      toast.error(t("messages.fillRequired"));
      return;
    }

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: formData.recipient_id,
      subject: formData.subject || null,
      body: formData.body,
      organization_id: profile?.organization_id,
      parent_id: replyTo?.id || null,
    });

    setSending(false);

    if (error) {
      toast.error(t("messages.sendFailed"));
      console.error("Error sending message:", error);
    } else {
      toast.success(t("messages.sendSuccess"));
      setFormData({ recipient_id: "", subject: "", body: "" });
      onOpenChange(false);
    }
  };

  const getBranchName = (branch: Branch) => {
    return isRTL && branch.name_ar ? branch.name_ar : branch.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{replyTo ? t("messages.reply") : t("messages.compose")}</DialogTitle>
          <DialogDescription>
            {replyTo ? t("messages.replyDescription") : t("messages.composeDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Filters - Only show when not replying */}
          {!replyTo && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                {t("messages.filterEmployees")}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Branch Filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {t("messages.branch")}
                  </Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("messages.allBranches")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("messages.allBranches")}</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {getBranchName(branch)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {t("messages.department")}
                  </Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("messages.allDepartments")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("messages.allDepartments")}</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("messages.searchEmployee")}
                  className="ps-9 h-9"
                />
              </div>

              {/* Filtered count */}
              <p className="text-xs text-muted-foreground">
                {t("messages.employeesFound", { count: filteredUsers.length })}
              </p>
            </div>
          )}

          {/* Recipient Select */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("messages.recipient")}
            </Label>
            <Select
              value={formData.recipient_id}
              onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}
              disabled={!!replyTo}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? t("common.loading") : t("messages.selectRecipient")} />
              </SelectTrigger>
              <SelectContent>
                {(replyTo ? allUsers : filteredUsers).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.full_name || user.email || user.id}</span>
                      {user.position && (
                        <span className="text-xs text-muted-foreground">{user.position}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {!replyTo && filteredUsers.length === 0 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    {t("messages.noEmployeesFound")}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t("messages.subject")}</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={t("messages.subjectPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">{t("messages.message")}</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder={t("messages.messagePlaceholder")}
              rows={5}
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={sending} className="flex-1">
              {sending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("messages.sending")}
                </>
              ) : (
                <>
                  <Send className="me-2 h-4 w-4" />
                  {t("messages.send")}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeMessageDialog;
