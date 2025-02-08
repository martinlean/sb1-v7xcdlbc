-- Create type for valid currencies
CREATE TYPE valid_currency AS ENUM (
  'BRL', 'USD', 'EUR'
);

-- Create type for valid languages
CREATE TYPE valid_language AS ENUM (
  'pt-BR', 'en-US', 'en-EU'
);

-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use supported values
UPDATE offers 
SET 
  currency = CASE 
    WHEN UPPER(TRIM(currency)) NOT IN ('BRL', 'USD', 'EUR') THEN 'USD'
    ELSE UPPER(TRIM(currency))
  END,
  language = CASE 
    WHEN currency = 'BRL' THEN 'pt-BR'
    WHEN currency = 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;

-- Alter columns to use the new types
ALTER TABLE offers 
  ALTER COLUMN currency TYPE valid_currency 
    USING currency::valid_currency,
  ALTER COLUMN language TYPE valid_language 
    USING language::valid_language;

-- Add helpful comments
COMMENT ON COLUMN offers.currency IS 'Payment currency (BRL, USD, EUR)';
COMMENT ON COLUMN offers.language IS 'Interface language (pt-BR, en-US, en-EU)';
COMMENT ON TYPE valid_currency IS 'Supported payment currencies';
COMMENT ON TYPE valid_language IS 'Supported interface languages';