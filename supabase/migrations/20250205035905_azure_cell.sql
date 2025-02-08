-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Enable public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Enable authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.uid() IS NOT NULL)
);

CREATE POLICY "Enable authenticated update"
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

CREATE POLICY "Enable authenticated delete"
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

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;