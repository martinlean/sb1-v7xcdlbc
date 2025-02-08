-- Drop existing policies
DROP POLICY IF EXISTS "seller_profiles_read_policy" ON seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_update_policy" ON seller_profiles;

-- Enable RLS
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "enable_profiles_select"
ON seller_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "enable_profiles_update"
ON seller_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON seller_profiles TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "enable_profiles_select" ON seller_profiles IS 'Allow authenticated users to read seller profiles';
COMMENT ON POLICY "enable_profiles_update" ON seller_profiles IS 'Allow users to update their own profiles';