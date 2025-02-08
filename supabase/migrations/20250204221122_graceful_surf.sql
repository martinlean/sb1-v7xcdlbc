-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active products" ON products;
DROP POLICY IF EXISTS "Users can manage their own products" ON products;

-- Create new policies for products
CREATE POLICY "products_access_policy"
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

-- Create policy for public access to active products
CREATE POLICY "public_products_policy"
ON products
FOR SELECT
TO public
USING (active = true);

-- Add function to validate product data
CREATE OR REPLACE FUNCTION validate_product_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate price
  IF NEW.price <= 0 THEN
    RAISE EXCEPTION 'Product price must be greater than zero';
  END IF;

  -- Validate image URL
  IF NEW.image IS NULL OR NEW.image = '' THEN
    RAISE EXCEPTION 'Product image URL is required';
  END IF;

  -- Set default values if not provided
  IF NEW.billing_name IS NULL THEN
    NEW.billing_name := NEW.name;
  END IF;

  IF NEW.support_email IS NULL THEN
    NEW.support_email := 'suporte@rewardsmidia.online';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product validation
DROP TRIGGER IF EXISTS validate_product_data_trigger ON products;
CREATE TRIGGER validate_product_data_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_data();

-- Add helpful comments
COMMENT ON POLICY "products_access_policy" ON products IS 
'Allow users to manage their own products and admins to manage all products';

COMMENT ON POLICY "public_products_policy" ON products IS 
'Allow public to view active products';