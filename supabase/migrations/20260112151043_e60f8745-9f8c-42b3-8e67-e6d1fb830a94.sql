-- إضافة أعمدة جديدة لجدول الطلبات لنظام الموافقة والتوصيل
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS father_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS grandfather_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS street VARCHAR(255),
ADD COLUMN IF NOT EXISTS building VARCHAR(100),
ADD COLUMN IF NOT EXISTS floor VARCHAR(50),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_company_id UUID,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_transfer_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

-- إنشاء جدول شركات التوصيل
CREATE TABLE IF NOT EXISTS public.delivery_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url TEXT,
  tracking_url_template TEXT,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة RLS لجدول شركات التوصيل
ALTER TABLE public.delivery_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read delivery companies"
ON public.delivery_companies FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin users to manage delivery companies"
ON public.delivery_companies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- إضافة المرجع الخارجي
ALTER TABLE public.sales_orders 
ADD CONSTRAINT fk_sales_orders_delivery_company 
FOREIGN KEY (delivery_company_id) REFERENCES public.delivery_companies(id) 
ON DELETE SET NULL;

-- إنشاء جدول سجل الموافقات
CREATE TABLE IF NOT EXISTS public.order_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- approved, rejected, escalated
  approved_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.order_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view order approvals"
ON public.order_approvals FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create order approvals"
ON public.order_approvals FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);