-- Create branches table for malls/stores
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES auth.users(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add branch_id to profiles to link employees to their branch
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branches
CREATE POLICY "Users can view branches in their organization" 
ON public.branches FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage branches" 
ON public.branches FOR ALL 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Update trigger for timestamps
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();