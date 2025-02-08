/*
  # Fix database relationships and policies

  1. Changes
    - Add missing foreign key between payments and customers
    - Update policies for better access control
    - Fix customers table relationships
    - Add metadata column to payments table

  2. Security
    - Maintain RLS policies
    - Ensure proper access control
*/

-- Add metadata column to payments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE payments ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Ensure foreign key exists between payments and customers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_customer_id_fkey'
  ) THEN
    ALTER TABLE payments 
    ADD CONSTRAINT payments_customer_id_fkey 
    FOREIGN KEY (customer_id) 
    REFERENCES customers(id);
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Users can view customers with transactions" ON customers;

-- Create new policies for payments
CREATE POLICY "Users can view their payments"
ON payments
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "Users can manage their payments"
ON payments
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Create new policies for customers
CREATE POLICY "Users can view their customers"
ON customers
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT DISTINCT customer_id 
    FROM payments 
    WHERE user_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_metadata ON payments USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_payments_customer_user ON payments(customer_id, user_id);

-- Add helpful comments
COMMENT ON TABLE payments IS 'Payment transactions with customer metadata';
COMMENT ON COLUMN payments.metadata IS 'Additional payment information including customer details';