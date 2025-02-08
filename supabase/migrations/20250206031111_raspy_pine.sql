-- Drop existing admin-related functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS check_admin_access();

-- Create improved admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM seller_profiles
    WHERE user_id = $1
    AND admin_access = true
    AND status = 'active'
  );
END;
$$;

-- Ensure admin_access column exists
ALTER TABLE seller_profiles 
ADD COLUMN IF NOT EXISTS admin_access boolean DEFAULT false;

-- Update existing admin
UPDATE seller_profiles
SET 
  admin_access = true,
  status = 'active'
WHERE email = 'analysistraffic04@gmail.com';

-- Create policy for admin access
CREATE POLICY "Allow admins full access"
ON seller_profiles
FOR ALL
TO authenticated
USING (
  is_admin(auth.uid())
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO anon;