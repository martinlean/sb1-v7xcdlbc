-- Add user_id column to products table
ALTER TABLE products 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update RLS policies to be user-specific
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON products;

CREATE POLICY "Users can manage their own products"
ON products
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Keep the public read policy for active products
DROP POLICY IF EXISTS "Allow public read access" ON products;

CREATE POLICY "Allow public read access to active products"
ON products
FOR SELECT
TO public
USING (active = true);