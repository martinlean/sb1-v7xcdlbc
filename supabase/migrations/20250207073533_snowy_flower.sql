-- Add UTMify token settings to seller_profiles
ALTER TABLE seller_profiles
ADD COLUMN IF NOT EXISTS utmify_settings jsonb DEFAULT jsonb_build_object(
  'enabled', false,
  'api_token', '',
  'track_methods', jsonb_build_object(
    'credit_card', true,
    'pix', true,
    'boleto', true
  ),
  'track_statuses', jsonb_build_object(
    'checkout_abandon', true,
    'paid', true,
    'refunded', true,
    'waiting_payment', true,
    'rejected', true,
    'chargeback', true,
    'dispute', true,
    'blocked', true,
    'pre_chargeback', true
  )
);

-- Add helpful comment
COMMENT ON COLUMN seller_profiles.utmify_settings IS 'UTMify integration settings including API token';