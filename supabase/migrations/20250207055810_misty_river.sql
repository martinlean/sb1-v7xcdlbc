-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use supported currencies
UPDATE offers 
SET 
  currency = CASE 
    WHEN UPPER(TRIM(currency)) NOT IN ('BRL', 'USD', 'EUR') THEN 'USD'
    ELSE UPPER(TRIM(currency))
  END,
  language = CASE 
    WHEN currency = 'BRL' THEN 'pt-BR'
    WHEN currency = 'USD' THEN 'en-US'
    WHEN currency = 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;

-- Add new currency constraint with only supported currencies
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(TRIM(currency)) IN ('BRL', 'USD', 'EUR')
);

-- Add matching language constraint
ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN ('pt-BR', 'en-US', 'en-EU')
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Currently supported payment processing currencies';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported checkout interface languages';