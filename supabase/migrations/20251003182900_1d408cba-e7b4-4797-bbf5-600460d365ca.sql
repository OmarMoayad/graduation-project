-- Create enum for purchase order status
CREATE TYPE purchase_order_status AS ENUM ('draft', 'confirmed', 'received', 'cancelled');

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_lines table
CREATE TABLE public.purchase_order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  received_quantity NUMERIC(15,3) DEFAULT 0,
  destination_location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor_pricelists table
CREATE TABLE public.vendor_pricelists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  product_id UUID NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  min_quantity NUMERIC(15,3) DEFAULT 1,
  currency TEXT DEFAULT 'USD',
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, product_id, valid_from)
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_pricelists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Purchase orders viewable by organization members"
  ON public.purchase_orders FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Purchase orders manageable by organization members"
  ON public.purchase_orders FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for purchase_order_lines
CREATE POLICY "Purchase order lines viewable by organization members"
  ON public.purchase_order_lines FOR SELECT
  USING (purchase_order_id IN (
    SELECT id FROM purchase_orders WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Purchase order lines manageable by organization members"
  ON public.purchase_order_lines FOR ALL
  USING (purchase_order_id IN (
    SELECT id FROM purchase_orders WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- RLS Policies for vendor_pricelists
CREATE POLICY "Vendor pricelists viewable by organization members"
  ON public.vendor_pricelists FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Vendor pricelists manageable by organization members"
  ON public.vendor_pricelists FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_pricelists_updated_at
  BEFORE UPDATE ON public.vendor_pricelists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();