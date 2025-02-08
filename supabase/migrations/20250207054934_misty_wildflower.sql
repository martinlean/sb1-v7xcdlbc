-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use new format
UPDATE offers 
SET 
  language = CASE 
    WHEN language IN ('en', 'en-US', 'en-GB') THEN 'en-US'
    WHEN language IN ('pt-BR', 'pt') THEN 'pt-BR'
    WHEN language IN ('es', 'es-ES', 'es-MX') THEN 'es-ES'
    ELSE 'en-US'
  END,
  currency = UPPER(TRIM(currency));

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

-- Add simplified language constraint
ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN (
    'en-US', 'en-GB', 'en-AU', 'en-CA',
    'pt-BR', 'pt-PT',
    'es-ES', 'es-MX', 'es-AR',
    'fr-FR', 'fr-CA',
    'de-DE',
    'it-IT',
    'ja-JP',
    'zh-CN'
  )
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'Stripe supported payment processing currencies';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported checkout interface languages';

-- Add payment_processor column to products if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS payment_processor text 
CHECK (payment_processor IN ('stripe', 'mercadopago'));

-- Add payment_settings column to products if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS payment_settings jsonb DEFAULT jsonb_build_object(
  'processor', 'stripe',
  'acceptPaymentsVia', 'cpf',
  'paymentMethods', jsonb_build_object(
    'creditCard', true,
    'pix', false
  ),
  'discounts', jsonb_build_object(
    'creditCard', 0,
    'pix', 0
  ),
  'creditCard', jsonb_build_object(
    'maxInstallments', 12,
    'defaultInstallment', 1
  ),
  'pix', jsonb_build_object(
    'expirationMinutes', 15
  )
);

-- Add helpful comments
COMMENT ON COLUMN products.payment_processor IS 'Payment processor to use (stripe or mercadopago)';
COMMENT ON COLUMN products.payment_settings IS 'Payment processor specific settings';