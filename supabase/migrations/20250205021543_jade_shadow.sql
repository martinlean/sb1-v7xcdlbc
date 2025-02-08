/*
  # Fix Storage Bucket and RLS Policies

  1. Changes
    - Create product-images bucket
    - Set up proper RLS policies for storage objects
  
  2. Security
    - Enable public read access for product images
    - Allow authenticated users to manage their own images
    - Ensure proper folder structure enforcement
*/

-- Create product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Access" ON storage.objects;

-- Create policies for storage.objects
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Individual User Access"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.uid()::text = (SPLIT_PART(name, '/', 1)) OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

CREATE POLICY "Individual User Update Access"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images' AND
  (auth.uid()::text = (SPLIT_PART(name, '/', 1)) OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

CREATE POLICY "Individual User Delete Access"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images' AND
  (auth.uid()::text = (SPLIT_PART(name, '/', 1)) OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

-- Add helpful comments
COMMENT ON POLICY "Public Access" ON storage.objects IS 'Allow public read access to all product images';
COMMENT ON POLICY "Individual User Access" ON storage.objects IS 'Allow users to upload images to their own folders';
COMMENT ON POLICY "Individual User Update Access" ON storage.objects IS 'Allow users to update their own images';
COMMENT ON POLICY "Individual User Delete Access" ON storage.objects IS 'Allow users to delete their own images';