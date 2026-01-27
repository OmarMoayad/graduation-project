-- Create sales_orders table to store customer orders from eCommerce
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  shipping_address TEXT,
  billing_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales_order_lines table to store order line items
CREATE TABLE public.sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;

-- Sales orders: organization members can manage all orders
CREATE POLICY "Sales orders manageable by organization members"
ON public.sales_orders
FOR ALL
USING (
  organization_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- Sales orders: portal users can view their own orders
CREATE POLICY "Portal users can view their own orders"
ON public.sales_orders
FOR SELECT
USING (
  portal_user_id = auth.uid()
);

-- Sales order lines: manageable by organization members (via order)
CREATE POLICY "Sales order lines manageable by organization members"
ON public.sales_order_lines
FOR ALL
USING (
  order_id IN (
    SELECT so.id FROM sales_orders so
    WHERE so.organization_id IN (
      SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
);

-- Sales order lines: portal users can view their own order lines
CREATE POLICY "Portal users can view their own order lines"
ON public.sales_order_lines
FOR SELECT
USING (
  order_id IN (
    SELECT so.id FROM sales_orders so
    WHERE so.portal_user_id = auth.uid()
  )
);

-- Create portal_users table to store eCommerce customer accounts
CREATE TABLE public.portal_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  shipping_address TEXT,
  billing_address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;

-- Portal users can view and update their own profile
CREATE POLICY "Portal users can view their own profile"
ON public.portal_users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Portal users can update their own profile"
ON public.portal_users
FOR UPDATE
USING (id = auth.uid());

-- Organization members can view portal users in their org
CREATE POLICY "Organization members can view portal users"
ON public.portal_users
FOR SELECT
USING (
  organization_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- Add trigger for updated_at on sales_orders
CREATE TRIGGER update_sales_orders_updated_at
BEFORE UPDATE ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on portal_users
CREATE TRIGGER update_portal_users_updated_at
BEFORE UPDATE ON public.portal_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();