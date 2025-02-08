-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

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
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT buckets_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id)
);

-- Create objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  CONSTRAINT objects_bucketid_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id),
  CONSTRAINT objects_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id)
);

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Auth Upload Access"
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

CREATE POLICY "Owner Update Access"
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

CREATE POLICY "Owner Delete Access"
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
COMMENT ON TABLE storage.buckets IS 'Storage buckets for storing files';
COMMENT ON TABLE storage.objects IS 'Storage objects (files) stored in buckets';
COMMENT ON POLICY "Public Access" ON storage.objects IS 'Allow public read access to product images';
COMMENT ON POLICY "Auth Upload Access" ON storage.objects IS 'Allow authenticated users to upload images';
COMMENT ON POLICY "Owner Update Access" ON storage.objects IS 'Allow owners to update their images';
COMMENT ON POLICY "Owner Delete Access" ON storage.objects IS 'Allow owners to delete their images';