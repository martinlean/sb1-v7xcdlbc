-- Function to ensure admin user exists and has proper access
CREATE OR REPLACE FUNCTION ensure_admin_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get or create admin user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'analysistraffic04@gmail.com';

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  -- Update admin user metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('is_admin', true)
      ELSE 
        raw_user_meta_data || jsonb_build_object('is_admin', true)
    END
  WHERE id = admin_user_id;

  -- Create or update seller profile
  INSERT INTO seller_profiles (
    user_id,
    name,
    email,
    status,
    admin_access
  )
  VALUES (
    admin_user_id,
    'Admin',
    'analysistraffic04@gmail.com',
    'active',
    true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    status = 'active',
    admin_access = true,
    updated_at = now();
END;
$$;

-- Execute the function
SELECT ensure_admin_access();

-- Drop the function after use
DROP FUNCTION ensure_admin_access();

-- Ensure proper permissions
GRANT ALL ON seller_profiles TO authenticated;
GRANT ALL ON seller_profiles TO anon;

-- Disable RLS temporarily to allow admin setup
ALTER TABLE seller_profiles DISABLE ROW LEVEL SECURITY;

-- Create or replace admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
  OR EXISTS (
    SELECT 1 
    FROM seller_profiles
    WHERE user_id = auth.uid()
    AND admin_access = true
    AND status = 'active'
  );
END;
$$;

-- Re-enable RLS
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON seller_profiles;

-- Create new policies
CREATE POLICY "seller_profiles_select_policy"
ON seller_profiles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "seller_profiles_update_policy"
ON seller_profiles FOR UPDATE
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