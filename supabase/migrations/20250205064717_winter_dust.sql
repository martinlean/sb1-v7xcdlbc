-- Drop existing policies
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "enable_public_select"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "enable_auth_insert"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "enable_auth_update"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "enable_auth_delete"
ON products FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Ensure user_id is set automatically
CREATE OR REPLACE FUNCTION set_product_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to the current user
  NEW.user_id = auth.uid();
  
  -- Set default values if not provided
  IF NEW.billing_name IS NULL THEN
    NEW.billing_name = NEW.name;
  END IF;
  
  IF NEW.support_email IS NULL THEN
    NEW.support_email = 'suporte@rewardsmidia.online';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS set_product_user_id_trigger ON products;
CREATE TRIGGER set_product_user_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_user_id();

-- Add helpful comments
COMMENT ON POLICY "enable_public_select" ON products IS 'Allow anyone to read products';
COMMENT ON POLICY "enable_auth_insert" ON products IS 'Allow authenticated users to create products';
COMMENT ON POLICY "enable_auth_update" ON products IS 'Allow authenticated users to update products';
COMMENT ON POLICY "enable_auth_delete" ON products IS 'Allow authenticated users to delete products';