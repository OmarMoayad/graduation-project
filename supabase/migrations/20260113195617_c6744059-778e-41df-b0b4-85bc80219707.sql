-- Fix contacts table: Add authentication requirement
CREATE POLICY "contacts_require_auth" ON public.contacts
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix portal_users table: Add authentication requirement  
CREATE POLICY "portal_users_require_auth" ON public.portal_users
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix organizations table: Replace overly permissive policy
DROP POLICY IF EXISTS "Organizations are viewable by members" ON public.organizations;

CREATE POLICY "Organizations viewable by authenticated members" ON public.organizations
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);