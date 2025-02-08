-- Drop existing policies
DROP POLICY IF EXISTS "allow_read_for_all" ON products;
DROP POLICY IF EXISTS "allow_insert_for_users" ON products;
DROP POLICY IF EXISTS "allow_update_for_owners" ON products;
DROP POLICY IF EXISTS "allow_delete_for_owners" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON products TO anon;

-- Create new policies
CREATE POLICY "allow_read_for_all"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_insert_for_authenticated"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_update_for_authenticated"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_delete_for_authenticated"
ON products FOR DELETE
TO authenticated
USING (true);

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