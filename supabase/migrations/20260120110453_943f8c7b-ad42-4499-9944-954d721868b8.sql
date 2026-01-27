-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view org profiles" ON public.profiles;

-- Create a new policy that uses the existing security definer function to avoid recursion
CREATE POLICY "Users can view org profiles"
ON public.profiles
FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id = public.get_user_organization_id(auth.uid())
);