-- Create payment methods enum
CREATE TYPE payment_method_type AS ENUM ('cash', 'card', 'bank_transfer', 'mobile_payment');

-- Create POS sessions table
CREATE TABLE pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  session_number TEXT NOT NULL,
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create POS orders table
CREATE TABLE pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  session_id UUID REFERENCES pos_sessions(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES contacts(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'paid', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create POS order lines table
CREATE TABLE pos_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create POS payments table
CREATE TABLE pos_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  payment_method payment_method_type NOT NULL,
  amount NUMERIC NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pos_sessions
CREATE POLICY "POS sessions manageable by organization members"
ON pos_sessions FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "POS sessions viewable by organization members"
ON pos_sessions FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- RLS Policies for pos_orders
CREATE POLICY "POS orders manageable by organization members"
ON pos_orders FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "POS orders viewable by organization members"
ON pos_orders FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- RLS Policies for pos_order_lines
CREATE POLICY "POS order lines manageable by organization members"
ON pos_order_lines FOR ALL
USING (order_id IN (
  SELECT id FROM pos_orders WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "POS order lines viewable by organization members"
ON pos_order_lines FOR SELECT
USING (order_id IN (
  SELECT id FROM pos_orders WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
));

-- RLS Policies for pos_payments
CREATE POLICY "POS payments manageable by organization members"
ON pos_payments FOR ALL
USING (order_id IN (
  SELECT id FROM pos_orders WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "POS payments viewable by organization members"
ON pos_payments FOR SELECT
USING (order_id IN (
  SELECT id FROM pos_orders WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
));

-- Add trigger for updated_at
CREATE TRIGGER update_pos_sessions_updated_at
  BEFORE UPDATE ON pos_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_orders_updated_at
  BEFORE UPDATE ON pos_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();