-- Update existing offers to use proper currency and language
UPDATE offers
SET 
  language = CASE 
    WHEN currency = 'BRL' THEN 'pt-BR'
    WHEN currency = 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;

-- Create function to get default language for currency
CREATE OR REPLACE FUNCTION get_default_language_for_currency(currency_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN CASE
    WHEN currency_code = 'BRL' THEN 'pt-BR'
    WHEN currency_code = 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;
END;
$$;

-- Create function to validate currency and language combination
CREATE OR REPLACE FUNCTION validate_currency_language()
RETURNS trigger AS $$
BEGIN
  -- Set default language if not provided
  IF NEW.language IS NULL THEN
    NEW.language := get_default_language_for_currency(NEW.currency);
  END IF;

  -- Validate currency and language combination
  IF NOT (
    (NEW.currency = 'BRL' AND NEW.language = 'pt-BR') OR
    (NEW.currency = 'EUR' AND NEW.language = 'en-EU') OR
    (NEW.currency = 'USD' AND NEW.language = 'en-US')
  ) THEN
    NEW.language := get_default_language_for_currency(NEW.currency);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for currency/language validation
DROP TRIGGER IF EXISTS validate_currency_language_trigger ON offers;
CREATE TRIGGER validate_currency_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION validate_currency_language();

-- Add helpful comments
COMMENT ON FUNCTION get_default_language_for_currency IS 'Get default interface language for a given currency';
COMMENT ON FUNCTION validate_currency_language IS 'Ensure currency and language combinations are valid';