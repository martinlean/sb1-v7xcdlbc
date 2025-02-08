-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their payments" ON payments;
DROP POLICY IF EXISTS "Users can manage their payments" ON payments;

-- Create new policies for payments with proper EXISTS clauses
CREATE POLICY "Users can view their payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      user_id = auth.uid() OR
      raw_user_meta_data->>'is_admin' = 'true'
    )
  )
);

CREATE POLICY "Users can manage their payments"
ON payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      user_id = auth.uid() OR
      raw_user_meta_data->>'is_admin' = 'true'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      user_id = auth.uid() OR
      raw_user_meta_data->>'is_admin' = 'true'
    )
  )
);

-- Add helpful comments
COMMENT ON POLICY "Users can view their payments" ON payments IS 
'Users can view their own payments, admins can view all payments';

COMMENT ON POLICY "Users can manage their payments" ON payments IS 
'Users can manage their own payments, admins can manage all payments';