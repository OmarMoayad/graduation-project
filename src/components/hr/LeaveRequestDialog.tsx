import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Loader2, Calendar } from "lucide-react";

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LeaveRequestDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: LeaveRequestDialogProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date) {
      toast.error(t("hr.fillRequiredFields"));
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error(t("hr.endDateError"));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("employee_leave_requests").insert({
        employee_id: user.id,
        organization_id: profile?.organization_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success(t("hr.leaveRequestSubmitted"));

      // Reset form
      setFormData({
        leave_type: "annual",
        start_date: "",
        end_date: "",
        reason: "",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting leave request:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("hr.requestLeave")}
          </DialogTitle>
          <DialogDescription>
            {t("hr.leaveRequestDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave_type">{t("hr.leaveType")}</Label>
            <Select
              value={formData.leave_type}
              onValueChange={(value) =>
                setFormData({ ...formData, leave_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">{t("hr.leaveTypes.annual")}</SelectItem>
                <SelectItem value="sick">{t("hr.leaveTypes.sick")}</SelectItem>
                <SelectItem value="unpaid">{t("hr.leaveTypes.unpaid")}</SelectItem>
                <SelectItem value="emergency">{t("hr.leaveTypes.emergency")}</SelectItem>
                <SelectItem value="other">{t("hr.leaveTypes.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t("hr.startDate")} *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">{t("hr.endDate")} *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t("hr.reason")}</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder={t("hr.leaveReasonPlaceholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("hr.submitRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveRequestDialog;
