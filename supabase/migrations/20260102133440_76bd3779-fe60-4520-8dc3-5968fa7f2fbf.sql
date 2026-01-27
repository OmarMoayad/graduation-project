-- Fix infinite recursion in profiles RLS by using a SECURITY DEFINER helper

CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Replace SELECT policies on profiles (avoid querying profiles from inside the policy)
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR organization_id = public.get_user_organization_id(auth.uid())
);