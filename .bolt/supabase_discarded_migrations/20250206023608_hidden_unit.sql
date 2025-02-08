-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  );
END;
$$;

-- Create function to check admin access
CREATE OR REPLACE FUNCTION check_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  RETURN NEW;
END;
$$;

-- Add admin_access column to seller_profiles
ALTER TABLE seller_profiles 
ADD COLUMN IF NOT EXISTS admin_access boolean DEFAULT false;

-- Update admin user's profile
UPDATE seller_profiles
SET admin_access = true, status = 'active'
WHERE email = 'analysistraffic04@gmail.com';

-- Add helpful comments
COMMENT ON FUNCTION is_admin() IS 'Checks if current user has admin privileges';
COMMENT ON FUNCTION check_admin_access() IS 'Trigger function to enforce admin-only access';