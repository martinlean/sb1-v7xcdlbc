-- Drop existing policies
DROP POLICY IF EXISTS "allow_read_for_all" ON products;
DROP POLICY IF EXISTS "allow_insert_for_authenticated" ON products;
DROP POLICY IF EXISTS "allow_update_for_authenticated" ON products;
DROP POLICY IF EXISTS "allow_delete_for_authenticated" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create new policies
CREATE POLICY "Enable read access for all users" 
ON products FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" 
ON products FOR UPDATE
TO authenticated 
USING (auth.uid() = user_id OR 
       EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'))
WITH CHECK (auth.uid() = user_id OR 
           EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'));

CREATE POLICY "Enable delete for users based on user_id" 
ON products FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR 
       EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'));

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

-- Add helpful comments
COMMENT ON POLICY "Enable read access for all users" ON products IS 'Allow anyone to read products';
COMMENT ON POLICY "Enable insert for authenticated users only" ON products IS 'Allow authenticated users to create products';
COMMENT ON POLICY "Enable update for users based on user_id" ON products IS 'Allow users to update their own products';
COMMENT ON POLICY "Enable delete for users based on user_id" ON products IS 'Allow users to delete their own products';