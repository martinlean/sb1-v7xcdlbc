-- Drop existing policies
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper checks
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
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
))
WITH CHECK (auth.uid() = user_id OR auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
));

CREATE POLICY "products_delete_policy"
ON products FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
));

-- Ensure proper grants
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Recreate trigger function with proper error handling
CREATE OR REPLACE FUNCTION set_product_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id to the current user on insert
  NEW.user_id = auth.uid();
  
  -- Ensure user_id is set
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS set_product_user_id_trigger ON products;
CREATE TRIGGER set_product_user_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_user_id();

-- Add helpful comments
COMMENT ON POLICY "products_select_policy" ON products IS 'Allow anyone to read products';
COMMENT ON POLICY "products_insert_policy" ON products IS 'Allow authenticated users to create products';
COMMENT ON POLICY "products_update_policy" ON products IS 'Allow users to update their own products';
COMMENT ON POLICY "products_delete_policy" ON products IS 'Allow users to delete their own products';