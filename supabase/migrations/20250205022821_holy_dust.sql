-- Add constraints to products table
ALTER TABLE products
ADD CONSTRAINT product_name_length CHECK (char_length(name) BETWEEN 3 AND 100),
ADD CONSTRAINT product_description_length CHECK (char_length(description) BETWEEN 10 AND 1000),
ADD CONSTRAINT product_price_positive CHECK (price >= 0),
ADD CONSTRAINT product_image_url CHECK (image ~ '^https?://.*');

-- Add trigger to validate product data
CREATE OR REPLACE FUNCTION validate_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate name
  IF NEW.name IS NULL OR length(trim(NEW.name)) < 3 THEN
    RAISE EXCEPTION 'Product name must be at least 3 characters long';
  END IF;

  -- Validate description
  IF NEW.description IS NULL OR length(trim(NEW.description)) < 10 THEN
    RAISE EXCEPTION 'Product description must be at least 10 characters long';
  END IF;

  -- Validate price
  IF NEW.price < 0 THEN
    RAISE EXCEPTION 'Product price cannot be negative';
  END IF;

  -- Validate image URL
  IF NEW.image IS NULL OR NEW.image = '' THEN
    RAISE EXCEPTION 'Product image is required';
  END IF;

  -- Set default values for membership fields
  IF NEW.membership_type IS NULL THEN
    NEW.membership_type := 'none';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS validate_product_trigger ON products;
CREATE TRIGGER validate_product_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product();

-- Add helpful comments
COMMENT ON CONSTRAINT product_name_length ON products IS 'Product name must be between 3 and 100 characters';
COMMENT ON CONSTRAINT product_description_length ON products IS 'Product description must be between 10 and 1000 characters';
COMMENT ON CONSTRAINT product_price_positive ON products IS 'Product price must be non-negative';
COMMENT ON CONSTRAINT product_image_url ON products IS 'Product image must be a valid URL';