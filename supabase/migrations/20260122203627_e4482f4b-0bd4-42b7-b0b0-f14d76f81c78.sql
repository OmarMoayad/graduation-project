-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Guest checkout requires valid organization" ON public.sales_orders;

-- Create a new policy that allows ANYONE (authenticated or anonymous) to insert orders
-- as long as organization_id is valid and active
CREATE POLICY "Allow guest and user checkout"
ON public.sales_orders
FOR INSERT
TO public
WITH CHECK (
  organization_id IS NOT NULL 
  AND organization_id IN (
    SELECT id FROM public.organizations WHERE is_active = true
  )
);

-- Also need to allow INSERT on sales_order_lines for the order items
DROP POLICY IF EXISTS "Allow guest order lines" ON public.sales_order_lines;

CREATE POLICY "Allow guest order lines"
ON public.sales_order_lines
FOR INSERT
TO public
WITH CHECK (
  order_id IN (
    SELECT id FROM public.sales_orders
  )
);