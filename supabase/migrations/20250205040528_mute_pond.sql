-- Drop existing product policies
DROP POLICY IF EXISTS "enable_read_access_for_authenticated_users" ON products;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON products;
DROP POLICY IF EXISTS "enable_update_for_authenticated_users" ON products;
DROP POLICY IF EXISTS "enable_delete_for_authenticated_users" ON products;

-- Create new simplified product policies
CREATE POLICY "allow_public_read_active_products"
ON products FOR SELECT
TO public
USING (active = true);

CREATE POLICY "allow_authenticated_read_products"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_products"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_update_products"
ON products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_delete_products"
ON products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_product_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_product_user_id_trigger ON products;
CREATE TRIGGER set_product_user_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_user_id();

-- Add helpful comments
COMMENT ON POLICY "allow_public_read_active_products" ON products IS 'Allow public to read active products';
COMMENT ON POLICY "allow_authenticated_read_products" ON products IS 'Allow authenticated users to read all products';
COMMENT ON POLICY "allow_authenticated_insert_products" ON products IS 'Allow authenticated users to create products';
COMMENT ON POLICY "allow_authenticated_update_products" ON products IS 'Allow users to update their own products';
COMMENT ON POLICY "allow_authenticated_delete_products" ON products IS 'Allow users to delete their own products';