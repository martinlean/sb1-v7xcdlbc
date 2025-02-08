/*
  # Create offers table

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `name` (text, nome público da oferta)
      - `internal_name` (text, nome interno para identificação)
      - `price` (numeric, preço da oferta)
      - `currency` (text, moeda da oferta)
      - `language` (text, idioma da oferta)
      - `billing_type` (text, tipo de cobrança: única ou recorrente)
      - `billing_cycle` (integer, ciclo de cobrança para recorrentes)
      - `billing_cycle_unit` (text, unidade do ciclo: dias, meses, anos)
      - `trial_days` (integer, dias de teste para recorrentes)
      - `active` (boolean, status da oferta)
      - `product_id` (uuid, referência ao produto)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `offers` table
    - Add policy for users to manage their own offers
    - Add policy for public to read active offers

  3. Constraints
    - Valid billing types
    - Valid billing cycle units
    - Valid currencies
    - Valid languages
*/

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  internal_name text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL,
  language text NOT NULL,
  billing_type text NOT NULL,
  billing_cycle integer,
  billing_cycle_unit text,
  trial_days integer,
  active boolean DEFAULT true,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own offers"
ON offers
FOR ALL
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can read active offers"
ON offers
FOR SELECT
TO public
USING (
  active = true AND
  product_id IN (
    SELECT id FROM products WHERE active = true
  )
);

-- Add constraints
ALTER TABLE offers
ADD CONSTRAINT valid_billing_type 
CHECK (billing_type IN ('one_time', 'recurring'));

ALTER TABLE offers
ADD CONSTRAINT valid_billing_cycle_unit
CHECK (
  (billing_type = 'one_time' AND billing_cycle IS NULL AND billing_cycle_unit IS NULL) OR
  (billing_type = 'recurring' AND billing_cycle IS NOT NULL AND billing_cycle_unit IN ('days', 'months', 'years'))
);

ALTER TABLE offers
ADD CONSTRAINT valid_currency
CHECK (currency IN ('USD', 'BRL', 'EUR', 'GBP'));

ALTER TABLE offers
ADD CONSTRAINT valid_language
CHECK (language IN ('pt-BR', 'en', 'es', 'fr'));

-- Add indexes
CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE INDEX idx_offers_active ON offers(active);
CREATE INDEX idx_offers_currency ON offers(currency);
CREATE INDEX idx_offers_language ON offers(language);

-- Add updated_at trigger
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE offers IS 'Product offers with different pricing and billing options';
COMMENT ON COLUMN offers.name IS 'Public name of the offer shown to customers';
COMMENT ON COLUMN offers.internal_name IS 'Internal name for offer identification';
COMMENT ON COLUMN offers.billing_type IS 'Type of billing: one_time or recurring';
COMMENT ON COLUMN offers.billing_cycle IS 'Number of billing cycles (for recurring only)';
COMMENT ON COLUMN offers.billing_cycle_unit IS 'Unit for billing cycle: days, months, or years';
COMMENT ON COLUMN offers.trial_days IS 'Number of trial days (for recurring only)';