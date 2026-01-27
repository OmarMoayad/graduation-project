-- Drop existing overly permissive policies on profiles
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create more secure policies for profiles table
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can view other profiles in their organization (excluding salary)
-- Note: For salary protection, we'd need a view, but for now restrict to same org
CREATE POLICY "Users can view org profiles"
ON public.profiles
FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id = (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Drop existing policies on sales_orders that may be too permissive
DROP POLICY IF EXISTS "Block anonymous read access to sales_orders" ON public.sales_orders;

-- Create secure policies for sales_orders
-- Organization members can view orders in their organization
CREATE POLICY "Org members can view their org orders"
ON public.sales_orders
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Portal users can only view their own orders
CREATE POLICY "Portal users view own orders"
ON public.sales_orders
FOR SELECT
USING (
  portal_user_id = auth.uid()
);