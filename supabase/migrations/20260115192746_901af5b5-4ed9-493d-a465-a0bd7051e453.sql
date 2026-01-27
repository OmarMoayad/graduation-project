-- Add role-based access control for sensitive financial data

-- Create a function to check user role (using existing has_role function as base)
CREATE OR REPLACE FUNCTION public.user_has_finance_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'manager')
  )
$$;

-- Update contact_bank_accounts policy to be role-based (admin or manager only)
DROP POLICY IF EXISTS "Contact bank accounts viewable by organization members" ON public.contact_bank_accounts;

CREATE POLICY "Contact bank accounts viewable by admin/manager"
ON public.contact_bank_accounts
FOR SELECT
TO authenticated
USING (
  contact_id IN (
    SELECT contacts.id FROM contacts
    WHERE contacts.organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
  AND public.user_has_finance_access(auth.uid())
);

-- Keep the manageable policy but restrict to admin/manager
DROP POLICY IF EXISTS "Contact bank accounts manageable by organization members" ON public.contact_bank_accounts;

CREATE POLICY "Contact bank accounts manageable by admin/manager"
ON public.contact_bank_accounts
FOR ALL
TO authenticated
USING (
  contact_id IN (
    SELECT contacts.id FROM contacts
    WHERE contacts.organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
  AND public.user_has_finance_access(auth.uid())
);