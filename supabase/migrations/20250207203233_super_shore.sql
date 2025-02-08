-- Drop existing currency and language constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Add simplified currency constraint
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  currency IN ('BRL', 'USD', 'EUR')
);

-- Add simplified language constraint
ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN ('pt-BR', 'en-US', 'en-EU')
);

-- Create or replace the currency validation function
CREATE OR REPLACE FUNCTION validate_offer_currency()
RETURNS trigger AS $$
BEGIN
  -- Normalize currency
  NEW.currency := TRIM(UPPER(NEW.currency));
  
  -- Set appropriate language based on currency
  NEW.language := CASE NEW.currency
    WHEN 'BRL' THEN 'pt-BR'
    WHEN 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_offer_currency_trigger ON offers;

-- Create new trigger
CREATE TRIGGER validate_offer_currency_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION validate_offer_currency();

-- Update existing offers to ensure consistency
UPDATE offers SET
  currency = TRIM(UPPER(currency)),
  language = CASE TRIM(UPPER(currency))
    WHEN 'BRL' THEN 'pt-BR'
    WHEN 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Allowed currencies: BRL, USD, EUR';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Allowed languages: pt-BR, en-US, en-EU';
COMMENT ON FUNCTION validate_offer_currency IS 'Ensures currency and language are properly set';