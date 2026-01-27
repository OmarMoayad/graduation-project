-- Allow public read access to active organizations for shop visitors
CREATE POLICY "Public can view active organizations for shop"
ON public.organizations
FOR SELECT
USING (is_active = true);

-- Allow public read access to active products with sales price for shop visitors  
CREATE POLICY "Public can view active products for shop"
ON public.products
FOR SELECT
USING (is_active = true AND sales_price > 0);

-- Allow public read access to active product categories for shop visitors
CREATE POLICY "Public can view active categories for shop"
ON public.product_categories
FOR SELECT
USING (is_active = true);