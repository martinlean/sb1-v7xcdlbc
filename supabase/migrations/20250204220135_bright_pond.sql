/*
  # Fix Payments RLS Policies

  1. Changes
    - Drop existing policies
    - Create new simplified policies with better performance
    - Add proper admin checks
    - Add proper user checks
    
  2. Security
    - Ensure proper access control for regular users and admins
    - Maintain data isolation between users
    - Allow admins to view all payments
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their payments" ON payments;
DROP POLICY IF EXISTS "Users can manage their payments" ON payments;

-- Create new simplified policies
CREATE POLICY "Users can view payments"
ON payments
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'::text
  )
);

CREATE POLICY "Users can manage payments"
ON payments
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'::text
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'::text
  )
);

-- Add helpful comments
COMMENT ON POLICY "Users can view payments" ON payments IS 
'Allow users to view their own payments and admins to view all payments';

COMMENT ON POLICY "Users can manage payments" ON payments IS 
'Allow users to manage their own payments and admins to manage all payments';