-- Allow public inserts on sales_orders for guest checkout
CREATE POLICY "Anyone can create a sales order (guest checkout)"
ON public.sales_orders
FOR INSERT
WITH CHECK (true);

-- Allow public inserts on sales_order_lines for guest checkout
CREATE POLICY "Anyone can create order lines for their order"
ON public.sales_order_lines
FOR INSERT
WITH CHECK (true);

-- Allow public read of products for shop
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Allow public read of product categories for shop
CREATE POLICY "Public can view active categories"
ON public.product_categories
FOR SELECT
USING (is_active = true);