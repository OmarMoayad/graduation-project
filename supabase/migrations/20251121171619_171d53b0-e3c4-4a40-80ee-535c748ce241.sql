-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create access_groups table
CREATE TABLE public.access_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (organization_id, name)
);

ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;

-- Create user_access_groups table
CREATE TABLE public.user_access_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.access_groups(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, group_id)
);

ALTER TABLE public.user_access_groups ENABLE ROW LEVEL SECURITY;

-- Create module_permissions table
CREATE TABLE public.module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.access_groups(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (group_id, module_name)
);

ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Create field_permissions table
CREATE TABLE public.field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.access_groups(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (group_id, module_name, field_name)
);

ALTER TABLE public.field_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for access_groups
CREATE POLICY "Admins can manage access groups"
ON public.access_groups FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view access groups"
ON public.access_groups FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for user_access_groups
CREATE POLICY "Admins can manage user access groups"
ON public.user_access_groups FOR ALL
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view their own access groups"
ON public.user_access_groups FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for module_permissions
CREATE POLICY "Admins can manage module permissions"
ON public.module_permissions FOR ALL
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view module permissions"
ON public.module_permissions FOR SELECT
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- RLS Policies for field_permissions
CREATE POLICY "Admins can manage field permissions"
ON public.field_permissions FOR ALL
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view field permissions"
ON public.field_permissions FOR SELECT
USING (
  group_id IN (
    SELECT id FROM access_groups 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Create trigger for updating access_groups
CREATE TRIGGER update_access_groups_updated_at
BEFORE UPDATE ON public.access_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();