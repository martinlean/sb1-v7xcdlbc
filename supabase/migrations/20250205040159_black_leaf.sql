-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete" ON storage.objects;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Create new storage policies
CREATE POLICY "product_images_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
);

CREATE POLICY "product_images_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (auth.uid() = owner OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

CREATE POLICY "product_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (auth.uid() = owner OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

-- Add helpful comments
COMMENT ON POLICY "product_images_public_select" ON storage.objects IS 'Allow public read access to product images';
COMMENT ON POLICY "product_images_auth_insert" ON storage.objects IS 'Allow authenticated users to upload product images';
COMMENT ON POLICY "product_images_auth_update" ON storage.objects IS 'Allow owners and admins to update product images';
COMMENT ON POLICY "product_images_auth_delete" ON storage.objects IS 'Allow owners and admins to delete product images';