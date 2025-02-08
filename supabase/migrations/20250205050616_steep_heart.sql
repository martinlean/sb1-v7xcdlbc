-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON seller_profiles;

-- Create seller_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_seller_user UNIQUE (user_id),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'banned'))
);

-- Enable RLS
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies with unique names
CREATE POLICY "seller_profiles_read_policy"
ON seller_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "seller_profiles_update_policy"
ON seller_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create seller profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.seller_profiles (user_id, name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_email ON seller_profiles(email);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_status ON seller_profiles(status);

-- Add helpful comments
COMMENT ON TABLE seller_profiles IS 'Seller profiles for all users';
COMMENT ON COLUMN seller_profiles.status IS 'Current status: active, suspended, banned';
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates seller profile when a new user registers';