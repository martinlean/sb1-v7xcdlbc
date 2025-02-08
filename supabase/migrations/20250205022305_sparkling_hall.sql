-- Create buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets,
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Access" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Delete Access" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.uid() = owner OR
   EXISTS (
     SELECT 1 FROM auth.users
     WHERE id = auth.uid()
     AND raw_user_meta_data->>'is_admin' = 'true'
   ))
);

CREATE POLICY "Allow users to update own images"
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

CREATE POLICY "Allow users to delete own images"
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
COMMENT ON POLICY "Allow public read access" ON storage.objects IS 'Allow public read access to product images';
COMMENT ON POLICY "Allow authenticated users to upload" ON storage.objects IS 'Allow users to upload images';
COMMENT ON POLICY "Allow users to update own images" ON storage.objects IS 'Allow users to update their own images';
COMMENT ON POLICY "Allow users to delete own images" ON storage.objects IS 'Allow users to delete their own images';