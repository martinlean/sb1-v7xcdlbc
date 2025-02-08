-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to active products" ON products;
DROP POLICY IF EXISTS "Users can manage their own products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON products;

-- Create new policies
CREATE POLICY "Anyone can read active products"
ON products
FOR SELECT
TO public
USING (active = true);

CREATE POLICY "Authenticated users can read all products"
ON products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own products"
ON products
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;