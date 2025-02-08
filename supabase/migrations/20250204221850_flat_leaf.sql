-- Drop existing policies
DROP POLICY IF EXISTS "products_access_policy" ON products;
DROP POLICY IF EXISTS "public_products_policy" ON products;

-- Create new policies with unique names
CREATE POLICY "products_user_access_policy"
ON products
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "products_public_access_policy"
ON products
FOR SELECT
TO public
USING (active = true);

-- Add helpful comments
COMMENT ON POLICY "products_user_access_policy" ON products IS 
'Allow users to manage their own products and admins to manage all products';

COMMENT ON POLICY "products_public_access_policy" ON products IS 
'Allow public to view active products';