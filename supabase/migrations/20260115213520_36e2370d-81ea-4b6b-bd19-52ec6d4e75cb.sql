-- Create inquiries table to store website/customer inquiries
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NULL,
  created_by uuid NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for admin list performance
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);

-- Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Read access: only authenticated users who have inquiries read permission
DROP POLICY IF EXISTS "Permitted users can view inquiries" ON public.inquiries;
CREATE POLICY "Permitted users can view inquiries"
ON public.inquiries
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.user_access_groups uag
    JOIN public.module_permissions mp ON mp.group_id = uag.group_id
    WHERE uag.user_id = auth.uid()
      AND mp.module_name = 'inquiries'
      AND mp.can_read = true
  )
  AND (
    organization_id IS NULL
    OR organization_id IN (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  )
);

-- Update access: only authenticated users who have inquiries update permission
DROP POLICY IF EXISTS "Permitted users can update inquiries" ON public.inquiries;
CREATE POLICY "Permitted users can update inquiries"
ON public.inquiries
FOR UPDATE
TO public
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.user_access_groups uag
    JOIN public.module_permissions mp ON mp.group_id = uag.group_id
    WHERE uag.user_id = auth.uid()
      AND mp.module_name = 'inquiries'
      AND mp.can_update = true
  )
  AND (
    organization_id IS NULL
    OR organization_id IN (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.user_access_groups uag
    JOIN public.module_permissions mp ON mp.group_id = uag.group_id
    WHERE uag.user_id = auth.uid()
      AND mp.module_name = 'inquiries'
      AND mp.can_update = true
  )
  AND (
    organization_id IS NULL
    OR organization_id IN (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  )
);

-- Delete access: only authenticated users who have inquiries delete permission
DROP POLICY IF EXISTS "Permitted users can delete inquiries" ON public.inquiries;
CREATE POLICY "Permitted users can delete inquiries"
ON public.inquiries
FOR DELETE
TO public
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.user_access_groups uag
    JOIN public.module_permissions mp ON mp.group_id = uag.group_id
    WHERE uag.user_id = auth.uid()
      AND mp.module_name = 'inquiries'
      AND mp.can_delete = true
  )
  AND (
    organization_id IS NULL
    OR organization_id IN (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  )
);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();