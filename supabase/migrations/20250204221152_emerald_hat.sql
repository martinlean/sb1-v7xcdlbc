-- Drop existing trigger
DROP TRIGGER IF EXISTS validate_product_data_trigger ON products;

-- Update function to use user's email for support
CREATE OR REPLACE FUNCTION validate_product_data()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
BEGIN
  -- Validate price
  IF NEW.price <= 0 THEN
    RAISE EXCEPTION 'Product price must be greater than zero';
  END IF;

  -- Validate image URL
  IF NEW.image IS NULL OR NEW.image = '' THEN
    RAISE EXCEPTION 'Product image URL is required';
  END IF;

  -- Set billing name if not provided
  IF NEW.billing_name IS NULL THEN
    NEW.billing_name := NEW.name;
  END IF;

  -- Get user's email for support
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Set support email to user's email
  IF NEW.support_email IS NULL THEN
    NEW.support_email := user_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product validation
CREATE TRIGGER validate_product_data_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_data();

-- Add helpful comment
COMMENT ON FUNCTION validate_product_data() IS 
'Validates product data and sets default support email to user''s email';