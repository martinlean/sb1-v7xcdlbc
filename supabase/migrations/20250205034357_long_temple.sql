/*
  # Fix seller profiles registration

  1. Changes
    - Add missing RLS policies for seller_profiles
    - Add function to auto-create seller profile on user registration
    - Fix constraints and indexes

  2. Security
    - Enable RLS
    - Add proper policies for insert/select
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON seller_profiles;

-- Enable RLS
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users"
ON seller_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for own profile"
ON seller_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for own profile"
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
    'pending_verification'
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

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_seller_profiles_email ON seller_profiles(email);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_status ON seller_profiles(status);

-- Add helpful comments
COMMENT ON TABLE seller_profiles IS 'Seller profiles with verification status';
COMMENT ON COLUMN seller_profiles.status IS 'Current status: pending_verification, active, suspended, banned';
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates seller profile when a new user registers';