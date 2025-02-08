-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their payments" ON payments;
DROP POLICY IF EXISTS "Users can manage their payments" ON payments;

-- Create new policies for payments
CREATE POLICY "Users can view their payments"
ON payments
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "Users can manage their payments"
ON payments
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Add helpful comments
COMMENT ON POLICY "Users can view their payments" ON payments IS 
'Users can view their own payments, admins can view all payments';

COMMENT ON POLICY "Users can manage their payments" ON payments IS 
'Users can manage their own payments, admins can manage all payments';