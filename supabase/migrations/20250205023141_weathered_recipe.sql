-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  internal_name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  currency text NOT NULL CHECK (currency IN ('USD', 'BRL', 'EUR')),
  language text NOT NULL CHECK (language IN ('en', 'pt-BR', 'es')),
  billing_type text NOT NULL CHECK (billing_type IN ('one_time', 'recurring')),
  billing_cycle integer,
  billing_cycle_unit text CHECK (billing_cycle_unit IN ('days', 'months', 'years')),
  trial_days integer DEFAULT 0,
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_billing_cycle CHECK (
    (billing_type = 'one_time' AND billing_cycle IS NULL AND billing_cycle_unit IS NULL) OR
    (billing_type = 'recurring' AND billing_cycle IS NOT NULL AND billing_cycle_unit IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own offers" ON offers;

-- Create policy
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;

-- Create updated_at trigger
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_offers_product;
DROP INDEX IF EXISTS idx_offers_active;

-- Create new indexes with unique names
CREATE INDEX IF NOT EXISTS idx_offers_product_id ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_active_status ON offers(active);