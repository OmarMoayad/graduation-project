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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";

interface EditSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    full_name: string;
    salary: number | null;
  } | null;
  onSuccess: () => void;
}

const EditSalaryDialog = ({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditSalaryDialogProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [salary, setSalary] = useState(employee?.salary?.toString() || "");
  const [currency, setCurrency] = useState("ILS");

  const handleSubmit = async () => {
    if (!employee) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          salary: salary ? parseFloat(salary) : null,
        })
        .eq("id", employee.id);

      if (error) throw error;

      toast.success(t("hr.salaryUpdated"));
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating salary:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  // Update salary value when employee changes
  if (employee && salary !== (employee.salary?.toString() || "")) {
    setSalary(employee.salary?.toString() || "");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("hr.editSalary")}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{t("hr.employee")}</p>
            <p className="font-medium">{employee?.full_name}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="salary">{t("hr.salary")}</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("common.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">₪ ILS</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="JOD">JOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSalaryDialog;
