-- Create seller profile for admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'analysistraffic04@gmail.com';

  -- Create seller profile if it doesn't exist
  IF admin_user_id IS NOT NULL THEN
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
    ON CONFLICT (user_id) DO UPDATE
    SET 
      status = 'active',
      admin_access = true,
      updated_at = now();
  END IF;
END $$;

-- Ensure admin user has admin flag in metadata
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN 
      jsonb_build_object('is_admin', true)
    ELSE 
      raw_user_meta_data || jsonb_build_object('is_admin', true)
  END
WHERE email = 'analysistraffic04@gmail.com';

-- Grant necessary permissions
GRANT ALL ON seller_profiles TO authenticated;
GRANT ALL ON seller_profiles TO anon;