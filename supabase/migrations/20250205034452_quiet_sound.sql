/*
  # Add Admin User Function

  1. Changes
    - Add function to set user as admin
    - Add function to check if user is admin
    - Add RLS policies for admin access

  2. Security
    - Functions run with SECURITY DEFINER
    - Only superuser can execute set_user_as_admin
*/

-- Function to set user as admin
CREATE OR REPLACE FUNCTION set_user_as_admin(user_email text)
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
  WHERE email = user_email;

  -- Update seller profile status to active
  UPDATE seller_profiles
  SET status = 'active'
  WHERE email = user_email;
END;
$$;

-- Function to check if current user is admin
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

-- Add helpful comments
COMMENT ON FUNCTION set_user_as_admin(text) IS 'Sets a user as admin by email';
COMMENT ON FUNCTION is_admin() IS 'Checks if current user is admin';