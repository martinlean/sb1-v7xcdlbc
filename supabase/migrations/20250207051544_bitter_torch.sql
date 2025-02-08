-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use simplified values
UPDATE offers 
SET 
  language = CASE 
    WHEN language NOT IN ('en', 'pt-BR', 'es') THEN 'en'
    ELSE language
  END,
  currency = UPPER(currency);

-- Add simplified constraints
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(currency) IN ('USD', 'BRL', 'EUR')
);

ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN ('en', 'pt-BR', 'es')
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Supported currencies: USD, BRL, EUR';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported languages: en, pt-BR, es';