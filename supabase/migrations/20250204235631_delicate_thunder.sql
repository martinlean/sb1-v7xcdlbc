-- Drop existing policies
DROP POLICY IF EXISTS "Customers Access Policy" ON customers;
DROP POLICY IF EXISTS "Users can view payments" ON payments;
DROP POLICY IF EXISTS "Users can manage payments" ON payments;

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "customers_read_policy"
ON customers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "customers_insert_policy"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update payments policies
CREATE POLICY "payments_read_policy"
ON payments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "payments_write_policy"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add customer_id to payments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN customer_id uuid REFERENCES customers(id);
  END IF;
END $$;