/*
  # Fix database relationships and queries

  1. Changes
    - Add missing indexes
    - Update policies for better access control
    - Fix customers and payments relationships

  2. Security
    - Maintain RLS policies
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their customers" ON customers;
DROP POLICY IF EXISTS "Users can view their payments" ON payments;
DROP POLICY IF EXISTS "Users can manage their payments" ON payments;

-- Create new policies for customers
CREATE POLICY "Users can view their customers"
ON customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM payments 
    WHERE payments.customer_id = customers.id 
    AND payments.user_id = auth.uid()
  ) OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
);

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_customer ON payments(user_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add helpful comments
COMMENT ON POLICY "Users can view their customers" ON customers IS 
'Users can only view customers who have made transactions with them';

COMMENT ON POLICY "Users can view their payments" ON payments IS 
'Users can view their own payments or all payments if admin';

COMMENT ON POLICY "Users can manage their payments" ON payments IS 
'Users can manage their own payments or all payments if admin';