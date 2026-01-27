-- Create delivery_drivers table for delivery staff
CREATE TABLE public.delivery_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.delivery_companies(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  license_number TEXT,
  is_active BOOLEAN DEFAULT true,
  is_external BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view delivery drivers in their organization"
ON public.delivery_drivers
FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can insert delivery drivers in their organization"
ON public.delivery_drivers
FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update delivery drivers in their organization"
ON public.delivery_drivers
FOR UPDATE
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can delete delivery drivers in their organization"
ON public.delivery_drivers
FOR DELETE
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Add driver assignment to sales_orders
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS delivery_driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_drivers_updated_at
BEFORE UPDATE ON public.delivery_drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();