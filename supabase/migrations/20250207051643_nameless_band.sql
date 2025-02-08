-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use new format
UPDATE offers 
SET 
  language = CASE 
    WHEN language = 'en' OR language LIKE 'en-%' THEN 'en-US'
    WHEN language = 'pt-BR' OR language LIKE 'pt-%' THEN 'pt-BR'
    WHEN language = 'es' OR language LIKE 'es-%' THEN 'es-ES'
    ELSE 'en-US'
  END,
  currency = UPPER(currency);

-- Add new constraints that match our currency and language configuration
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(currency) IN (
    -- Major currencies first
    'USD', 'EUR', 'GBP', 'BRL',
    -- Other supported currencies
    'AUD', 'CAD', 'JPY'
    -- Add more as needed...
  )
);

ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN (
    -- English variants
    'en-US', 'en-GB', 'en-AU', 'en-CA',
    -- Portuguese variants
    'pt-BR', 'pt-PT',
    -- Spanish variants
    'es-ES', 'es-MX', 'es-AR',
    -- French variants
    'fr-FR', 'fr-CA',
    -- German variants
    'de-DE',
    -- Other major languages
    'it-IT', 'ja-JP', 'zh-CN'
    -- Add more as needed...
  )
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Supported payment processing currencies';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported checkout interface languages';