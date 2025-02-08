-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use BRL as default
UPDATE offers 
SET 
  currency = CASE 
    WHEN UPPER(TRIM(currency)) NOT IN ('BRL', 'USD', 'EUR') THEN 'BRL'
    ELSE UPPER(TRIM(currency))
  END,
  language = CASE 
    WHEN currency = 'BRL' OR currency IS NULL THEN 'pt-BR'
    WHEN currency = 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;

-- Add new constraints
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(TRIM(currency)) IN ('BRL', 'USD', 'EUR')
);

ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN ('pt-BR', 'en-US', 'en-EU')
);

-- Add helpful comments
COMMENT ON COLUMN offers.currency IS 'Payment currency (BRL, USD, EUR)';
COMMENT ON COLUMN offers.language IS 'Interface language (pt-BR, en-US, en-EU)';