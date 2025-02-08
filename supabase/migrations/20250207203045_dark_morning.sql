-- Drop existing currency constraint
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;

-- Add new currency constraint with proper Euro handling
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(TRIM(currency)) IN ('BRL', 'USD', 'EUR')
);

-- Update function to handle Euro currency properly
CREATE OR REPLACE FUNCTION validate_currency_language()
RETURNS trigger AS $$
BEGIN
  -- Normalize currency to uppercase
  NEW.currency := UPPER(TRIM(NEW.currency));
  
  -- Set default language based on currency
  IF NEW.language IS NULL OR NEW.language = '' THEN
    NEW.language := CASE
      WHEN NEW.currency = 'BRL' THEN 'pt-BR'
      WHEN NEW.currency = 'EUR' THEN 'en-EU'
      ELSE 'en-US'
    END;
  END IF;

  -- Ensure valid currency/language combination
  IF NOT (
    (NEW.currency = 'BRL' AND NEW.language = 'pt-BR') OR
    (NEW.currency = 'EUR' AND NEW.language = 'en-EU') OR
    (NEW.currency = 'USD' AND NEW.language = 'en-US')
  ) THEN
    -- Auto-correct language based on currency
    NEW.language := CASE
      WHEN NEW.currency = 'BRL' THEN 'pt-BR'
      WHEN NEW.currency = 'EUR' THEN 'en-EU'
      ELSE 'en-US'
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS validate_currency_language_trigger ON offers;
CREATE TRIGGER validate_currency_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION validate_currency_language();

-- Update existing offers to ensure proper currency/language combinations
UPDATE offers
SET 
  currency = UPPER(TRIM(currency)),
  language = CASE
    WHEN UPPER(TRIM(currency)) = 'BRL' THEN 'pt-BR'
    WHEN UPPER(TRIM(currency)) = 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Supported payment currencies (BRL, USD, EUR)';
COMMENT ON FUNCTION validate_currency_language IS 'Ensures valid currency and language combinations';