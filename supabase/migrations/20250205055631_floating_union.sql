-- Drop existing RLS policies
DROP POLICY IF EXISTS "allow_public_read_active_products" ON products;
DROP POLICY IF EXISTS "allow_authenticated_read_products" ON products;
DROP POLICY IF EXISTS "allow_authenticated_insert_products" ON products;
DROP POLICY IF EXISTS "allow_authenticated_update_products" ON products;
DROP POLICY IF EXISTS "allow_authenticated_delete_products" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "enable_read_for_all"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "enable_insert_for_auth"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "enable_update_for_auth"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "enable_delete_for_auth"
ON products FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;