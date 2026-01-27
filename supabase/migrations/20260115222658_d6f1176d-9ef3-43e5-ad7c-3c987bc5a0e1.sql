
-- Update existing users to approved status
UPDATE public.profiles 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Allow admins to update any profile in their organization
CREATE POLICY "Admins can update profiles in their organization"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') 
  AND organization_id = get_user_organization_id(auth.uid())
);
