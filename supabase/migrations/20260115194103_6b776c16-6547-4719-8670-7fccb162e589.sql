-- Create shop_settings table to store shop configuration
CREATE TABLE public.shop_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#2ECC71',
  secondary_color TEXT DEFAULT '#27AE60',
  font_size TEXT DEFAULT 'medium',
  show_prices BOOLEAN DEFAULT true,
  show_stock BOOLEAN DEFAULT false,
  banner_image TEXT DEFAULT '',
  welcome_text TEXT DEFAULT 'Welcome to our store',
  welcome_text_ar TEXT DEFAULT 'مرحباً بكم في متجرنا',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- Organization members can view their shop settings
CREATE POLICY "Organization members can view shop settings"
ON public.shop_settings FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- Organization members can insert shop settings
CREATE POLICY "Organization members can insert shop settings"
ON public.shop_settings FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- Organization members can update shop settings
CREATE POLICY "Organization members can update shop settings"
ON public.shop_settings FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_shop_settings_updated_at
BEFORE UPDATE ON public.shop_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();