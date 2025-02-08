-- Add admin_access column to seller_profiles
ALTER TABLE seller_profiles 
ADD COLUMN IF NOT EXISTS admin_access boolean DEFAULT false;

-- Update admin user's profile
UPDATE seller_profiles
SET admin_access = true, status = 'active'
WHERE email = 'analysistraffic04@gmail.com';

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM seller_profiles
    WHERE user_id = auth.uid()
    AND admin_access = true
    AND status = 'active'
  );
END;
$$;

-- Add helpful comments
COMMENT ON COLUMN seller_profiles.admin_access IS 'Indicates if user has admin access';
COMMENT ON FUNCTION is_admin() IS 'Checks if current user has admin privileges';