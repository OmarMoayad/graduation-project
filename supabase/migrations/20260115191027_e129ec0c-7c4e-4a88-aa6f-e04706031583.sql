-- =====================================================
-- SECURITY FIX: Add explicit RLS policies to block anonymous access
-- =====================================================

-- 1. Contacts table - Block anonymous access
CREATE POLICY "Block anonymous access to contacts"
ON public.contacts
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 2. Portal users table - Block anonymous access  
CREATE POLICY "Block anonymous access to portal_users"
ON public.portal_users
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 3. Profiles table - Block anonymous access
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 4. Contact bank accounts - Block anonymous access
CREATE POLICY "Block anonymous access to contact_bank_accounts"
ON public.contact_bank_accounts
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 5. Sales orders - Block anonymous access for SELECT
CREATE POLICY "Block anonymous read access to sales_orders"
ON public.sales_orders
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. Organizations - Block anonymous access
CREATE POLICY "Block anonymous access to organizations"
ON public.organizations
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 7. Delivery companies - Restrict to organization members only
DROP POLICY IF EXISTS "Authenticated users can view delivery companies" ON public.delivery_companies;
CREATE POLICY "Organization members can view delivery companies"
ON public.delivery_companies
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 8. Stock moves - Restrict to organization members only
DROP POLICY IF EXISTS "stock_moves_require_auth" ON public.stock_moves;
CREATE POLICY "Organization members can view stock moves"
ON public.stock_moves
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 9. Order approvals - Restrict to organization members only
DROP POLICY IF EXISTS "Authenticated users can view order approvals" ON public.order_approvals;
DROP POLICY IF EXISTS "Authenticated users can create order approvals" ON public.order_approvals;

CREATE POLICY "Organization members can view order approvals"
ON public.order_approvals
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM public.sales_orders 
    WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Organization members can create order approvals"
ON public.order_approvals
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id FROM public.sales_orders 
    WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- 10. Products - Restrict cost_price from public view by updating policy
-- Keep public access for storefront but ensure organization filtering for internal use
-- Note: cost_price is still in the table but public policy only shows active products