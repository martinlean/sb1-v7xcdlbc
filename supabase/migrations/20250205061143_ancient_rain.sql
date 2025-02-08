-- Drop existing policies
DROP POLICY IF EXISTS "enable_read_for_all" ON products;
DROP POLICY IF EXISTS "enable_insert_for_auth" ON products;
DROP POLICY IF EXISTS "enable_update_for_auth" ON products;
DROP POLICY IF EXISTS "enable_delete_for_auth" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "allow_read_for_all"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_insert_for_users"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_update_for_owners"
ON products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_delete_for_owners"
ON products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure user_id is set automatically
CREATE OR REPLACE FUNCTION set_user_id_on_product()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set user_id
DROP TRIGGER IF EXISTS set_product_user_id_trigger ON products;
CREATE TRIGGER set_product_user_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_product();