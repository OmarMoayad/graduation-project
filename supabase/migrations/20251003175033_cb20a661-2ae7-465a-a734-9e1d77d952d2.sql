-- =====================================================
-- CONTACT TAGS (for categorization)
-- =====================================================
CREATE TABLE public.contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, name)
);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contact tags viewable by organization members"
  ON public.contact_tags FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Contact tags manageable by organization members"
  ON public.contact_tags FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- CONTACTS (Partners in Odoo)
-- =====================================================
CREATE TYPE public.contact_type AS ENUM ('contact', 'invoice', 'delivery', 'other', 'private');

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  is_company BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL, -- For contact persons under companies
  
  -- Contact Details
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  
  -- Address
  street TEXT,
  street2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  
  -- Business Info
  company_registry TEXT, -- Company registration number
  tax_id TEXT, -- VAT/Tax ID
  
  -- Flags
  is_customer BOOLEAN DEFAULT true,
  is_vendor BOOLEAN DEFAULT false,
  
  -- Contact Type
  contact_type public.contact_type DEFAULT 'contact',
  
  -- Additional Info
  title TEXT, -- Mr., Mrs., Dr., etc.
  job_position TEXT,
  notes TEXT,
  
  -- Image
  image_url TEXT,
  
  -- Credit Management
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts viewable by organization members"
  ON public.contacts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Contacts manageable by organization members"
  ON public.contacts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- CONTACT TAG ASSIGNMENTS (Many-to-Many)
-- =====================================================
CREATE TABLE public.contact_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(contact_id, tag_id)
);

ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contact tag assignments viewable by organization members"
  ON public.contact_tag_assignments FOR SELECT
  USING (
    contact_id IN (
      SELECT id FROM public.contacts 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Contact tag assignments manageable by organization members"
  ON public.contact_tag_assignments FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM public.contacts 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- CONTACT BANK ACCOUNTS
-- =====================================================
CREATE TABLE public.contact_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  
  bank_name TEXT,
  account_number TEXT NOT NULL,
  account_holder_name TEXT,
  swift_code TEXT,
  iban TEXT,
  
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contact_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contact bank accounts viewable by organization members"
  ON public.contact_bank_accounts FOR SELECT
  USING (
    contact_id IN (
      SELECT id FROM public.contacts 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Contact bank accounts manageable by organization members"
  ON public.contact_bank_accounts FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM public.contacts 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_bank_accounts_updated_at BEFORE UPDATE ON public.contact_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_contacts_organization ON public.contacts(organization_id);
CREATE INDEX idx_contacts_parent ON public.contacts(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_contacts_is_customer ON public.contacts(organization_id, is_customer) WHERE is_customer = true;
CREATE INDEX idx_contacts_is_vendor ON public.contacts(organization_id, is_vendor) WHERE is_vendor = true;
CREATE INDEX idx_contacts_name ON public.contacts(organization_id, name);
CREATE INDEX idx_contacts_email ON public.contacts(email) WHERE email IS NOT NULL;

CREATE INDEX idx_contact_tags_organization ON public.contact_tags(organization_id);
CREATE INDEX idx_contact_tag_assignments_contact ON public.contact_tag_assignments(contact_id);
CREATE INDEX idx_contact_tag_assignments_tag ON public.contact_tag_assignments(tag_id);

CREATE INDEX idx_contact_bank_accounts_contact ON public.contact_bank_accounts(contact_id);