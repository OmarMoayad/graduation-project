-- 1. Fix profiles table: Add authentication requirement and restrict to org members only
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND (id = auth.uid() OR organization_id = get_user_organization_id(auth.uid()))
);

-- Add INSERT policy for profiles (for handle_new_user trigger fallback)
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Fix portal_users: Make policies more restrictive
DROP POLICY IF EXISTS "portal_users_require_auth" ON public.portal_users;
DROP POLICY IF EXISTS "Portal users can view their own profile" ON public.portal_users;
DROP POLICY IF EXISTS "Organization members can view portal users" ON public.portal_users;

CREATE POLICY "Portal users can view own profile" ON public.portal_users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Org members can view their portal users" ON public.portal_users
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- 3. Fix contacts: Make policy more restrictive (already has org check but add auth)
DROP POLICY IF EXISTS "contacts_require_auth" ON public.contacts;
DROP POLICY IF EXISTS "Contacts viewable by organization members" ON public.contacts;

CREATE POLICY "Contacts viewable by authenticated org members" ON public.contacts
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- 4. Fix stock_moves: Add authentication requirement
CREATE POLICY "stock_moves_require_auth" ON public.stock_moves
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Fix handle_new_user function: Add fixed search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for the user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Organization')
  RETURNING id INTO new_org_id;

  -- Create the user profile
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_org_id
  );

  -- Assign admin role to new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$$;

-- 6. Fix get_user_organization_id function: Add fixed search_path
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = _user_id LIMIT 1;
$$;

-- 7. Fix has_role function: Ensure it has fixed search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- 8. Fix sales_orders: Make guest checkout more secure by requiring organization context
DROP POLICY IF EXISTS "Anyone can create a sales order (guest checkout)" ON public.sales_orders;

CREATE POLICY "Guest checkout requires valid organization" ON public.sales_orders
FOR INSERT WITH CHECK (
  organization_id IS NOT NULL 
  AND organization_id IN (SELECT id FROM organizations WHERE is_active = true)
);

-- 9. Fix sales_order_lines: Make insert more restrictive
DROP POLICY IF EXISTS "Anyone can create order lines for their order" ON public.sales_order_lines;

CREATE POLICY "Order lines require valid order" ON public.sales_order_lines
FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM sales_orders)
);