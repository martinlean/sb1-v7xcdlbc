/*
  # Fix Database Policies

  1. Changes
    - Drop existing policies
    - Recreate policies with proper checks
  
  2. Security
    - Ensure proper access control for all tables
    - Add admin access where needed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their customers" ON customers;
DROP POLICY IF EXISTS "Users can view customers with transactions" ON customers;
DROP POLICY IF EXISTS "Public can read customer data" ON customers;

-- Create new policy for customers
CREATE POLICY "Customers Access Policy"
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

-- Add helpful comment
COMMENT ON POLICY "Customers Access Policy" ON customers IS 
'Users can only view customers who have made transactions with them, admins can view all';