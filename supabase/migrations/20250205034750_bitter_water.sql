/*
  # Add Payment Providers Schema

  1. New Tables
    - payment_providers
      - id (uuid, primary key)
      - name (text)
      - code (text)
      - type (text)
      - config (jsonb)
      - is_active (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS
    - Only admins can manage providers
    - Authenticated users can read active providers

  3. Initial Data
    - Stripe configuration
    - MercadoPago configuration
*/

-- Create payment providers table
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('gateway', 'processor', 'acquirer')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_config CHECK (jsonb_typeof(config) = 'object')
);

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for active providers"
ON payment_providers FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Enable admin access"
ON payment_providers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON payment_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial providers
INSERT INTO payment_providers (name, code, type, config, is_active)
VALUES
  (
    'Stripe',
    'stripe',
    'gateway',
    jsonb_build_object(
      'public_key', 'pk_live_51OSh71JaNghssXXxkhjvslPULVIO3zWwV6SP7iLlivYpvfrNgx8Qyyjzi6tze2ZQ5STbcdkpRJXZlukLyF70IWmd00UT1cizDg',
      'secret_key', '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',
      'webhook_url', 'https://swapage.link/webhook-stripe',
      'webhook_secret', 'whsec_your_webhook_secret_here',
      'supported_currencies', ARRAY['USD', 'EUR', 'GBP'],
      'supported_payment_methods', ARRAY['card'],
      'supported_countries', ARRAY['US', 'GB', 'EU']
    ),
    true
  ),
  (
    'MercadoPago',
    'mercadopago',
    'gateway',
    jsonb_build_object(
      'public_key', 'APP_USR-4f157b79-95c1-4532-99ae-dbce47d11ced',
      'access_token', 'APP_USR-4913751720075877-062315-a23bd465119a3996b9ffe6e204cb7c62-1641718483',
      'webhook_url', 'https://swapage.link/webhook-mercadopago',
      'supported_currencies', ARRAY['BRL', 'ARS', 'CLP', 'COP', 'MXN', 'PEN', 'UYU'],
      'supported_payment_methods', ARRAY['card', 'pix', 'boleto'],
      'supported_countries', ARRAY['BR', 'AR', 'CL', 'CO', 'MX', 'PE', 'UY']
    ),
    true
  );

-- Add indexes
CREATE INDEX idx_payment_providers_code ON payment_providers(code);
CREATE INDEX idx_payment_providers_active ON payment_providers(is_active);

-- Add helpful comments
COMMENT ON TABLE payment_providers IS 'Payment providers configuration and settings';
COMMENT ON COLUMN payment_providers.code IS 'Unique identifier code for the provider';
COMMENT ON COLUMN payment_providers.type IS 'Type of provider: gateway, processor, or acquirer';
COMMENT ON COLUMN payment_providers.config IS 'Provider-specific configuration in JSON format';