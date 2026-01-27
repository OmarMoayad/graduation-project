-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS
-- =====================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_id TEXT,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by members"
  ON public.organizations FOR SELECT
  USING (true);

-- =====================================================
-- USER PROFILES
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- PRODUCT CATEGORIES
-- =====================================================
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by organization members"
  ON public.product_categories FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Categories manageable by organization members"
  ON public.product_categories FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TYPE public.product_type AS ENUM ('storable', 'consumable', 'service');
CREATE TYPE public.uom_type AS ENUM ('unit', 'kg', 'g', 'lbs', 'oz', 'liter', 'm', 'cm', 'ft', 'dozen', 'pack');

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  description TEXT,
  product_type public.product_type DEFAULT 'storable',
  uom public.uom_type DEFAULT 'unit',
  
  -- Pricing
  sales_price DECIMAL(15, 2) DEFAULT 0,
  cost_price DECIMAL(15, 2) DEFAULT 0,
  
  -- Tracking
  tracking_enabled BOOLEAN DEFAULT false,
  lot_tracking BOOLEAN DEFAULT false,
  expiry_tracking BOOLEAN DEFAULT false,
  
  -- Stock control
  reorder_point DECIMAL(15, 3) DEFAULT 0,
  reorder_quantity DECIMAL(15, 3) DEFAULT 0,
  
  -- Product image
  image_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, sku)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products viewable by organization members"
  ON public.products FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Products manageable by organization members"
  ON public.products FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- WAREHOUSES
-- =====================================================
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, code)
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warehouses viewable by organization members"
  ON public.warehouses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Warehouses manageable by organization members"
  ON public.warehouses FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- LOCATIONS (Hierarchical structure like Odoo)
-- =====================================================
CREATE TYPE public.location_type AS ENUM ('view', 'internal', 'customer', 'vendor', 'transit', 'inventory');

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  code TEXT,
  location_type public.location_type DEFAULT 'internal',
  
  -- For view locations (organizational)
  is_parent BOOLEAN DEFAULT false,
  
  -- Aisle/Rack/Shelf structure
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations viewable by organization members"
  ON public.locations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Locations manageable by organization members"
  ON public.locations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- LOT/SERIAL NUMBERS
-- =====================================================
CREATE TABLE public.lot_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  lot_number TEXT NOT NULL,
  serial_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, product_id, lot_number)
);

ALTER TABLE public.lot_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lot numbers viewable by organization members"
  ON public.lot_numbers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Lot numbers manageable by organization members"
  ON public.lot_numbers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- STOCK QUANTS (Current stock levels per location)
-- =====================================================
CREATE TABLE public.stock_quants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lot_numbers(id) ON DELETE SET NULL,
  
  quantity DECIMAL(15, 3) DEFAULT 0,
  reserved_quantity DECIMAL(15, 3) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id, location_id, lot_id)
);

ALTER TABLE public.stock_quants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock quants viewable by organization members"
  ON public.stock_quants FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Stock quants manageable by organization members"
  ON public.stock_quants FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- STOCK MOVES (Complete audit trail)
-- =====================================================
CREATE TYPE public.move_type AS ENUM ('in', 'out', 'transfer', 'adjustment', 'purchase', 'sale', 'return');

CREATE TABLE public.stock_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lot_numbers(id) ON DELETE SET NULL,
  
  source_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  destination_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  
  quantity DECIMAL(15, 3) NOT NULL,
  uom public.uom_type DEFAULT 'unit',
  
  move_type public.move_type NOT NULL,
  reference TEXT, -- PO number, SO number, etc.
  notes TEXT,
  
  unit_cost DECIMAL(15, 2),
  total_cost DECIMAL(15, 2),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock moves viewable by organization members"
  ON public.stock_moves FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Stock moves creatable by organization members"
  ON public.stock_moves FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_quants_updated_at BEFORE UPDATE ON public.stock_quants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE ORGANIZATION AND PROFILE ON USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization for new user
  INSERT INTO public.organizations (name, code)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Organization',
    'ORG-' || substring(NEW.id::text from 1 for 8)
  )
  RETURNING id INTO new_org_id;
  
  -- Create profile linked to organization
  INSERT INTO public.profiles (id, organization_id, full_name, email)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_products_organization ON public.products(organization_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_sku ON public.products(organization_id, sku);
CREATE INDEX idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX idx_warehouses_organization ON public.warehouses(organization_id);
CREATE INDEX idx_locations_organization ON public.locations(organization_id);
CREATE INDEX idx_locations_warehouse ON public.locations(warehouse_id);
CREATE INDEX idx_locations_parent ON public.locations(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX idx_stock_quants_product ON public.stock_quants(product_id);
CREATE INDEX idx_stock_quants_location ON public.stock_quants(location_id);
CREATE INDEX idx_stock_quants_organization ON public.stock_quants(organization_id);

CREATE INDEX idx_stock_moves_product ON public.stock_moves(product_id);
CREATE INDEX idx_stock_moves_organization ON public.stock_moves(organization_id);
CREATE INDEX idx_stock_moves_created_at ON public.stock_moves(created_at DESC);

CREATE INDEX idx_lot_numbers_product ON public.lot_numbers(product_id);
CREATE INDEX idx_lot_numbers_expiry ON public.lot_numbers(expiry_date) WHERE expiry_date IS NOT NULL;