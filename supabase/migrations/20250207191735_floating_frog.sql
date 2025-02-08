-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Add new currency constraint that allows all major currencies
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

-- Add language constraint that supports all major locales
ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN (
    -- English variants
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ', 'en-IE', 'en-ZA', 'en-IN',
    -- Portuguese variants
    'pt-BR', 'pt-PT',
    -- Spanish variants
    'es-ES', 'es-MX', 'es-AR', 'es-CL', 'es-CO', 'es-PE',
    -- French variants
    'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH',
    -- German variants
    'de-DE', 'de-AT', 'de-CH',
    -- Other major languages
    'it-IT', 'ja-JP', 'zh-CN', 'zh-TW',
    'ar-AE', 'ar-SA', 'ar-EG',
    'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
    'ko-KR', 'ru-RU', 'pl-PL', 'tr-TR',
    'hi-IN', 'bn-IN', 'fil-PH'
  )
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Supported payment processing currencies that can be selected by sellers';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported interface languages based on user location';