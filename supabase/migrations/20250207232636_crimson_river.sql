-- Drop existing policies
DROP POLICY IF EXISTS "allow_all_authenticated" ON offers;

-- Disable RLS temporarily
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON offers TO authenticated;
GRANT ALL ON offers TO anon;

-- Re-enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create new simplified policy
CREATE POLICY "enable_offers_access"
ON offers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update language handling function
CREATE OR REPLACE FUNCTION set_offer_language()
RETURNS trigger AS $$
BEGIN
  -- Set language based on currency
  NEW.language := CASE
    WHEN NEW.currency = 'BRL' THEN 'pt-BR'
    WHEN NEW.currency = 'EUR' THEN 'es-ES'
    WHEN NEW.currency = 'USD' AND (NEW.language LIKE 'es%' OR NEW.language = 'es') THEN 'es-ES'
    WHEN NEW.currency = 'USD' THEN 'en-US'
    ELSE 'en-US'
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate language trigger
DROP TRIGGER IF EXISTS set_offer_language_trigger ON offers;
CREATE TRIGGER set_offer_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION set_offer_language();

-- Update existing offers to ensure correct language
UPDATE offers SET
  language = CASE
    WHEN currency = 'BRL' THEN 'pt-BR'
    WHEN currency = 'EUR' THEN 'es-ES'
    WHEN currency = 'USD' AND (language LIKE 'es%' OR language = 'es') THEN 'es-ES'
    WHEN currency = 'USD' THEN 'en-US'
    ELSE 'en-US'
  END;