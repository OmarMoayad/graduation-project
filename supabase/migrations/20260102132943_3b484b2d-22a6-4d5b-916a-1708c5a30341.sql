-- Allow users to view profiles in their organization
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Update RLS policy for user_roles to allow viewing roles of users in same organization  
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Users can view roles of users in their organization
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles
FOR SELECT
USING (
  user_id IN (
    SELECT p2.id FROM profiles p1
    JOIN profiles p2 ON p1.organization_id = p2.organization_id
    WHERE p1.id = auth.uid()
  )
);

-- Admins can manage roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));