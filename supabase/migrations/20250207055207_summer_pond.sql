-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use new format
UPDATE offers 
SET 
  language = CASE 
    WHEN currency = 'USD' THEN 'en-US'
    WHEN currency = 'EUR' THEN 'en-EU'
    WHEN currency = 'GBP' THEN 'en-GB'
    WHEN currency = 'BRL' THEN 'pt-BR'
    WHEN currency = 'AUD' THEN 'en-AU'
    WHEN currency = 'CAD' THEN 'en-CA'
    WHEN currency = 'CHF' THEN 'de-CH'
    WHEN currency = 'CNY' THEN 'zh-CN'
    WHEN currency = 'JPY' THEN 'ja-JP'
    WHEN currency = 'INR' THEN 'en-IN'
    WHEN currency = 'DKK' THEN 'da-DK'
    WHEN currency = 'NOK' THEN 'nb-NO'
    WHEN currency = 'SEK' THEN 'sv-SE'
    WHEN currency = 'HKD' THEN 'zh-HK'
    WHEN currency = 'SGD' THEN 'en-SG'
    WHEN currency = 'MXN' THEN 'es-MX'
    WHEN currency = 'ARS' THEN 'es-AR'
    WHEN currency = 'CLP' THEN 'es-CL'
    WHEN currency = 'COP' THEN 'es-CO'
    ELSE 'en-US'
  END;

-- Add new currency constraint with Stripe supported currencies
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(TRIM(currency)) IN (
    -- Major currencies
    'USD', 'EUR', 'GBP', 'BRL', 'AUD', 'CAD', 'CHF', 'CNY', 'JPY', 'INR',
    -- European currencies
    'DKK', 'NOK', 'SEK',
    -- Asian currencies
    'HKD', 'SGD',
    -- Latin American currencies
    'MXN', 'ARS', 'CLP', 'COP'
  )
);

-- Add language constraint matching currencies
ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN (
    'en-US', 'en-EU', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-SG',
    'pt-BR',
    'es-ES', 'es-MX', 'es-AR', 'es-CL', 'es-CO',
    'fr-FR', 'fr-CA',
    'de-DE', 'de-CH',
    'it-IT',
    'ja-JP',
    'zh-CN', 'zh-HK',
    'da-DK',
    'nb-NO',
    'sv-SE'
  )
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Stripe supported payment processing currencies';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported checkout interface languages';