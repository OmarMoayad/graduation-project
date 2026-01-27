-- Fix security issues: Restrict public access to sensitive business data

-- 1. Product Categories: Remove public access, restrict to authenticated users for shop
DROP POLICY IF EXISTS "Public can view active categories" ON public.product_categories;

CREATE POLICY "Authenticated users can view active categories"
ON public.product_categories
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. Products: Remove overly permissive public access
-- First drop the existing public policy that exposes cost_price
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

-- Create a policy for authenticated users (shop users who are logged in)
CREATE POLICY "Authenticated users can view active products"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);