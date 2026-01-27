
-- Add approval status and employee fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS is_on_leave BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS leave_start DATE,
ADD COLUMN IF NOT EXISTS leave_end DATE,
ADD COLUMN IF NOT EXISTS leave_reason TEXT;

-- Create employee work hours table
CREATE TABLE public.employee_work_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  work_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, work_date)
);

-- Create employee leave requests table
CREATE TABLE public.employee_leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'emergency', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_work_hours
CREATE POLICY "Users can view work hours in their organization" 
ON public.employee_work_hours FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage work hours" 
ON public.employee_work_hours FOR ALL 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Employees can log their own hours" 
ON public.employee_work_hours FOR INSERT 
WITH CHECK (
  employee_id = auth.uid() 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- RLS Policies for employee_leave_requests
CREATE POLICY "Users can view leave requests in their organization" 
ON public.employee_leave_requests FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Employees can create their own leave requests" 
ON public.employee_leave_requests FOR INSERT 
WITH CHECK (
  employee_id = auth.uid() 
  AND organization_id = get_user_organization_id(auth.uid())
);

CREATE POLICY "Admins can manage leave requests" 
ON public.employee_leave_requests FOR UPDATE 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Update trigger for timestamps
CREATE TRIGGER update_employee_work_hours_updated_at
BEFORE UPDATE ON public.employee_work_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_leave_requests_updated_at
BEFORE UPDATE ON public.employee_leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to set pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  
  -- Create profile linked to organization with pending approval
  INSERT INTO public.profiles (id, organization_id, full_name, email, approval_status)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'pending'
  );
  
  RETURN NEW;
END;
$function$;
