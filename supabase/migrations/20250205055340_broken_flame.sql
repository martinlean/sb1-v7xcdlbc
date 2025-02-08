-- Add billing_name column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS billing_name text;

-- Add support_email column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS support_email text;

-- Set default values for existing records
UPDATE products 
SET billing_name = name,
    support_email = 'suporte@rewardsmidia.online' 
WHERE billing_name IS NULL 
   OR support_email IS NULL;

-- Make columns required
ALTER TABLE products 
ALTER COLUMN billing_name SET NOT NULL,
ALTER COLUMN support_email SET NOT NULL;

-- Add comments
COMMENT ON COLUMN products.billing_name IS 'Name used for billing/payment purposes';
COMMENT ON COLUMN products.support_email IS 'Email address for product support';

-- Update validate_product_data function
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

  -- Get user's email for support
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Set default values if not provided
  IF NEW.billing_name IS NULL THEN
    NEW.billing_name := NEW.name;
  END IF;

  IF NEW.support_email IS NULL THEN
    NEW.support_email := user_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;