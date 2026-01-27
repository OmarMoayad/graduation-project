-- Allow edge function (service role) to insert inquiries without JWT
-- Also allow public inserts since this is from the website contact form
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiries"
ON public.inquiries
FOR INSERT
TO public
WITH CHECK (true);