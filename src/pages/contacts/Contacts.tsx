import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, Building2, User, Search, Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import ComposeMessageDialog from "@/components/messaging/ComposeMessageDialog";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: string;
  name: string;
  is_company: boolean;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  city: string | null;
  country: string | null;
  is_customer: boolean;
  is_vendor: boolean;
  is_active: boolean;
}

const Contacts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "customers" | "vendors" | "employees">("all");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    is_company: false,
    email: "",
    phone: "",
    mobile: "",
    website: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    tax_id: "",
    company_registry: "",
    is_customer: true,
    is_vendor: false,
    title: "",
    job_position: "",
    notes: "",
    credit_limit: "0"
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadContacts();
    }
  }, [organizationId, filterType]);

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

  const loadContacts = async () => {
    let query = supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (filterType === "customers") {
      query = query.eq("is_customer", true);
    } else if (filterType === "vendors") {
      query = query.eq("is_vendor", true);
    } else if (filterType === "employees") {
      query = query.eq("is_customer", false).eq("is_vendor", false);
    }

    const { data, error } = await query;

    if (error) {
      toast.error(t("contacts.failedLoad"));
    } else {
      setContacts(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("contacts").insert({
      organization_id: organizationId,
      name: formData.name,
      is_company: formData.is_company,
      email: formData.email || null,
      phone: formData.phone || null,
      mobile: formData.mobile || null,
      website: formData.website || null,
      street: formData.street || null,
      street2: formData.street2 || null,
      city: formData.city || null,
      state: formData.state || null,
      zip: formData.zip || null,
      country: formData.country || null,
      tax_id: formData.tax_id || null,
      company_registry: formData.company_registry || null,
      is_customer: formData.is_customer,
      is_vendor: formData.is_vendor,
      title: formData.title || null,
      job_position: formData.job_position || null,
      notes: formData.notes || null,
      credit_limit: parseFloat(formData.credit_limit),
      created_by: user.id
    } as any);

    if (error) {
      toast.error(error.message || t("contacts.failedLoad"));
    } else {
      toast.success(t("contacts.createdSuccess"));
      setIsDialogOpen(false);
      resetForm();
      loadContacts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      is_company: false,
      email: "",
      phone: "",
      mobile: "",
      website: "",
      street: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      tax_id: "",
      company_registry: "",
      is_customer: true,
      is_vendor: false,
      title: "",
      job_position: "",
      notes: "",
      credit_limit: "0"
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">{t("contacts.title")}</h2>
            <p className="text-muted-foreground">{t("contacts.subtitle")}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/messages")}>
              <MessageSquare className="me-2 h-4 w-4" />
              {t("messages.title")}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary">
                  <Plus className="me-2 h-4 w-4" />
                  {t("contacts.addContact")}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("contacts.createNew")}</DialogTitle>
                <DialogDescription>{t("contacts.addDescription")}</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">{t("contacts.general")}</TabsTrigger>
                    <TabsTrigger value="address">{t("contacts.address")}</TabsTrigger>
                    <TabsTrigger value="business">{t("contacts.businessInfo")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 mt-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch
                        id="is_company"
                        checked={formData.is_company}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_company: checked })}
                      />
                      <Label htmlFor="is_company" className="font-semibold">{t("contacts.isCompany")}</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {!formData.is_company && (
                        <div className="space-y-2">
                          <Label htmlFor="title">{t("contacts.title_field")}</Label>
                          <Select
                            value={formData.title}
                            onValueChange={(value) => setFormData({ ...formData, title: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("common.select")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr.">Mr.</SelectItem>
                              <SelectItem value="Mrs.">Mrs.</SelectItem>
                              <SelectItem value="Ms.">Ms.</SelectItem>
                              <SelectItem value="Dr.">Dr.</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className={`space-y-2 ${!formData.is_company ? "" : "col-span-2"}`}>
                        <Label htmlFor="name">{formData.is_company ? t("contacts.companyName") : t("contacts.contactName")} *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {!formData.is_company && (
                      <div className="space-y-2">
                        <Label htmlFor="job_position">{t("contacts.jobPosition")}</Label>
                        <Input
                          id="job_position"
                          value={formData.job_position}
                          onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("common.email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("common.phone")}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">{t("common.mobile")}</Label>
                        <Input
                          id="mobile"
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">{t("common.website")}</Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://"
                        />
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch
                          id="is_customer"
                          checked={formData.is_customer}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_customer: checked })}
                        />
                        <Label htmlFor="is_customer">{t("contacts.customer")}</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Switch
                          id="is_vendor"
                          checked={formData.is_vendor}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_vendor: checked })}
                        />
                        <Label htmlFor="is_vendor">{t("contacts.vendor")}</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">{t("contacts.street")}</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="street2">{t("contacts.street2")}</Label>
                      <Input
                        id="street2"
                        value={formData.street2}
                        onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">{t("contacts.city")}</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state">{t("contacts.stateProvince")}</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zip">{t("contacts.zipCode")}</Label>
                        <Input
                          id="zip"
                          value={formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">{t("contacts.country")}</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="business" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">{t("contacts.taxId")}</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_registry">{t("contacts.companyRegistry")}</Label>
                      <Input
                        id="company_registry"
                        value={formData.company_registry}
                        onChange={(e) => setFormData({ ...formData, company_registry: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="credit_limit">{t("contacts.creditLimit")}</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        step="0.01"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">{t("common.notes")}</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">{t("contacts.createContact")}</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("contacts.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("contacts.allContacts")}</SelectItem>
              <SelectItem value="customers">{t("contacts.customers")}</SelectItem>
              <SelectItem value="vendors">{t("contacts.vendors")}</SelectItem>
              <SelectItem value="employees">{t("contacts.employees")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="p-4 hover:shadow-lg transition-smooth">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  contact.is_company ? "bg-primary/10" : "bg-secondary/10"
                }`}>
                  {contact.is_company ? (
                    <Building2 className="h-6 w-6 text-primary" />
                  ) : (
                    <User className="h-6 w-6 text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{contact.name}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {contact.is_customer && (
                      <Badge variant="default" className="text-xs">{t("contacts.customer")}</Badge>
                    )}
                    {contact.is_vendor && (
                      <Badge variant="secondary" className="text-xs">{t("contacts.vendor")}</Badge>
                    )}
                  </div>
                  
                  {contact.email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  
                  {(contact.city || contact.country) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{[contact.city, contact.country].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t("contacts.noContactsFound")}</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? t("contacts.adjustSearch") : t("contacts.getStarted")}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-primary">
                <Plus className="me-2 h-4 w-4" />
                {t("contacts.addContact")}
              </Button>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Contacts;
