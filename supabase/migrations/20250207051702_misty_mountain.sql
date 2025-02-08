-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use new format
UPDATE offers 
SET 
  language = CASE 
    WHEN language IN ('en', 'en-US', 'en-GB') THEN 'en'
    WHEN language IN ('pt-BR', 'pt') THEN 'pt-BR'
    WHEN language IN ('es', 'es-ES', 'es-MX') THEN 'es'
    ELSE 'en'
  END,
  currency = UPPER(TRIM(currency));

-- Add new constraints with simplified values
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(TRIM(currency)) IN ('USD', 'EUR', 'GBP', 'BRL')
);

ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN ('en', 'pt-BR', 'es')
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Supported payment processing currencies';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported checkout interface languages';