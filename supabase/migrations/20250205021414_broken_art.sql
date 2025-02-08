/*
  # Fix Products RLS Policies

  1. Changes
    - Drop existing RLS policies for products
    - Create new comprehensive RLS policies
    - Add storage policies for product images
  
  2. Security
    - Enable RLS on products table
    - Add policies for CRUD operations
    - Add storage bucket policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "products_user_access_policy" ON products;
DROP POLICY IF EXISTS "products_public_access_policy" ON products;

-- Create new policies
CREATE POLICY "enable_read_access_for_authenticated_users"
ON products FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "enable_insert_for_authenticated_users"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "enable_update_for_authenticated_users"
ON products FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
)
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "enable_delete_for_authenticated_users"
ON products FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Create storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable storage policies
CREATE POLICY "enable_public_read_access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "enable_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.uid() = (storage.foldername(name))[1]::uuid OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

CREATE POLICY "enable_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (auth.uid() = (storage.foldername(name))[1]::uuid OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
)
WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.uid() = (storage.foldername(name))[1]::uuid OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

CREATE POLICY "enable_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (auth.uid() = (storage.foldername(name))[1]::uuid OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);