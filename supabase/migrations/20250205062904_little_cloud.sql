-- Drop existing product policies
DROP POLICY IF EXISTS "allow_read_for_all" ON products;
DROP POLICY IF EXISTS "allow_insert_for_authenticated" ON products;
DROP POLICY IF EXISTS "allow_update_for_authenticated" ON products;
DROP POLICY IF EXISTS "allow_delete_for_authenticated" ON products;

-- Create new simplified policies
CREATE POLICY "products_select_policy"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "products_insert_policy"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "products_update_policy"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "products_delete_policy"
ON products FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Create function to automatically set user_id
CREATE OR REPLACE FUNCTION set_product_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user_id
DROP TRIGGER IF EXISTS set_product_user_id_trigger ON products;
CREATE TRIGGER set_product_user_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_user_id();

-- Add helpful comments
COMMENT ON POLICY "products_select_policy" ON products IS 'Allow anyone to read products';
COMMENT ON POLICY "products_insert_policy" ON products IS 'Allow authenticated users to create products';
COMMENT ON POLICY "products_update_policy" ON products IS 'Allow authenticated users to update products';
COMMENT ON POLICY "products_delete_policy" ON products IS 'Allow authenticated users to delete products';