-- Drop existing policies
DROP POLICY IF EXISTS "enable_public_select" ON products;
DROP POLICY IF EXISTS "enable_auth_insert" ON products;
DROP POLICY IF EXISTS "enable_auth_update" ON products;
DROP POLICY IF EXISTS "enable_auth_delete" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create super simple policies
CREATE POLICY "allow_all_select"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_all_insert"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_all_update"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_delete"
ON products FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Simplify trigger function
CREATE OR REPLACE FUNCTION set_product_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to the current user
  NEW.user_id = auth.uid();
  
  -- Set default values
  NEW.billing_name = COALESCE(NEW.billing_name, NEW.name);
  NEW.support_email = COALESCE(NEW.support_email, 'suporte@rewardsmidia.online');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS set_product_user_id_trigger ON products;
CREATE TRIGGER set_product_user_id_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_user_id();