-- Enable RLS for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "Users can insert payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user metadata to set is_admin flag
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('is_admin', true)
      ELSE 
        raw_user_meta_data || jsonb_build_object('is_admin', true)
    END
  WHERE email = admin_email;

  -- Update seller profile status to active
  UPDATE seller_profiles
  SET status = 'active'
  WHERE email = admin_email;
END;
$$;

-- Set admin user
SELECT create_admin_user('analysistraffic04@gmail.com');

-- Add helpful comments
COMMENT ON POLICY "Users can view their own payments" ON payments IS 
'Users can only view their own payments, while admins can view all payments';

COMMENT ON POLICY "Users can insert payments" ON payments IS 
'Users can create new payments';

COMMENT ON FUNCTION create_admin_user(text) IS 
'Sets a user as admin by email address';