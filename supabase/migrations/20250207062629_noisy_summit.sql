-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Create temporary columns
ALTER TABLE offers 
ADD COLUMN currency_new text,
ADD COLUMN language_new text;

-- Update temporary columns with normalized values
UPDATE offers 
SET 
  currency_new = CASE 
    WHEN UPPER(TRIM(currency::text)) NOT IN ('BRL', 'USD', 'EUR') THEN 'USD'
    ELSE UPPER(TRIM(currency::text))
  END,
  language_new = CASE 
    WHEN currency::text = 'BRL' THEN 'pt-BR'
    WHEN currency::text = 'EUR' THEN 'en-EU'
    ELSE 'en-US'
  END;

-- Drop old columns
ALTER TABLE offers 
DROP COLUMN currency,
DROP COLUMN language;

-- Rename new columns
ALTER TABLE offers 
RENAME COLUMN currency_new TO currency;

ALTER TABLE offers 
RENAME COLUMN language_new TO language;

-- Add NOT NULL constraints
ALTER TABLE offers 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN language SET NOT NULL;

-- Add new CHECK constraints
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  currency IN ('BRL', 'USD', 'EUR')
);

ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN ('pt-BR', 'en-US', 'en-EU')
);

-- Add helpful comments
COMMENT ON COLUMN offers.currency IS 'Payment currency (BRL, USD, EUR)';
COMMENT ON COLUMN offers.language IS 'Interface language (pt-BR, en-US, en-EU)';