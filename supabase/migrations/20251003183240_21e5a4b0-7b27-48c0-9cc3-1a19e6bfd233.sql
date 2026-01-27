-- Add foreign key constraints to purchase_orders table
ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_organization_id_fkey 
  FOREIGN KEY (organization_id) 
  REFERENCES public.organizations(id) 
  ON DELETE CASCADE;

ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_vendor_id_fkey 
  FOREIGN KEY (vendor_id) 
  REFERENCES public.contacts(id) 
  ON DELETE RESTRICT;

ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Add foreign key constraints to purchase_order_lines table
ALTER TABLE public.purchase_order_lines
  ADD CONSTRAINT purchase_order_lines_purchase_order_id_fkey 
  FOREIGN KEY (purchase_order_id) 
  REFERENCES public.purchase_orders(id) 
  ON DELETE CASCADE;

ALTER TABLE public.purchase_order_lines
  ADD CONSTRAINT purchase_order_lines_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE RESTRICT;

ALTER TABLE public.purchase_order_lines
  ADD CONSTRAINT purchase_order_lines_destination_location_id_fkey 
  FOREIGN KEY (destination_location_id) 
  REFERENCES public.locations(id) 
  ON DELETE SET NULL;

-- Add foreign key constraints to vendor_pricelists table
ALTER TABLE public.vendor_pricelists
  ADD CONSTRAINT vendor_pricelists_organization_id_fkey 
  FOREIGN KEY (organization_id) 
  REFERENCES public.organizations(id) 
  ON DELETE CASCADE;

ALTER TABLE public.vendor_pricelists
  ADD CONSTRAINT vendor_pricelists_vendor_id_fkey 
  FOREIGN KEY (vendor_id) 
  REFERENCES public.contacts(id) 
  ON DELETE CASCADE;

ALTER TABLE public.vendor_pricelists
  ADD CONSTRAINT vendor_pricelists_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;