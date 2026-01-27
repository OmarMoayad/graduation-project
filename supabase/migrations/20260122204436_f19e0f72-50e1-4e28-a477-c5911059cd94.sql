-- 1) Fix linter: avoid WITH CHECK (true) on public.inquiries while keeping public submissions
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiries"
ON public.inquiries
FOR INSERT
TO public
WITH CHECK (
  length(trim(name)) > 0
  AND length(trim(email)) > 0
  AND length(trim(subject)) > 0
  AND length(trim(message)) > 0
);

-- 2) Harden guest checkout policy: if portal_user_id is provided it must match the logged-in user
DROP POLICY IF EXISTS "Allow guest and user checkout" ON public.sales_orders;
CREATE POLICY "Allow guest and user checkout"
ON public.sales_orders
FOR INSERT
TO public
WITH CHECK (
  organization_id IS NOT NULL
  AND organization_id IN (
    SELECT organizations.id
    FROM public.organizations
    WHERE organizations.is_active = true
  )
  AND (
    portal_user_id IS NULL
    OR portal_user_id = auth.uid()
  )
);

-- 3) Allow inserting sales_order_lines for guest/user orders without relying on SELECT access to sales_orders
--    Use a SECURITY DEFINER helper to avoid RLS blocking the existence check.
CREATE OR REPLACE FUNCTION public.can_insert_sales_order_line(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sales_orders so
    WHERE so.id = _order_id
      AND (
        so.portal_user_id IS NULL
        OR so.portal_user_id = auth.uid()
      )
  );
$$;

DROP POLICY IF EXISTS "Allow guest order lines" ON public.sales_order_lines;
DROP POLICY IF EXISTS "Order lines require valid order" ON public.sales_order_lines;

CREATE POLICY "Allow guest and user order lines"
ON public.sales_order_lines
FOR INSERT
TO public
WITH CHECK (
  public.can_insert_sales_order_line(order_id)
);
