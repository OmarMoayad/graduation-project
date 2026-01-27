-- Create storage bucket for shop assets (banners, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to shop-assets bucket
CREATE POLICY "Authenticated users can upload shop assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update shop assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-assets');

-- Allow authenticated users to delete shop assets
CREATE POLICY "Authenticated users can delete shop assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-assets');

-- Allow public read access to shop assets
CREATE POLICY "Public can view shop assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-assets');