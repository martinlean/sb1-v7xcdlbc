-- Add payment_settings column to products table
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

-- Add upsell_settings column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS upsell_settings jsonb DEFAULT jsonb_build_object(
  'enabled', false,
  'success_url', null,
  'offers', '[]'::jsonb
);

-- Add helpful comments
COMMENT ON COLUMN products.payment_settings IS 'Payment processor and method settings';
COMMENT ON COLUMN products.upsell_settings IS 'Upsell/downsell configuration and offers';