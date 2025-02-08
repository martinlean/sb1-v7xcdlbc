-- Drop existing policies and triggers
DROP POLICY IF EXISTS "enable_offers_access" ON offers;
DROP POLICY IF EXISTS "enable_all_operations" ON offers;
DROP TRIGGER IF EXISTS set_offer_language_trigger ON offers;
DROP TRIGGER IF EXISTS handle_offer_language_trigger ON offers;

-- Ensure RLS is enabled
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create new policy that allows all operations
CREATE POLICY "enable_all_operations"
ON offers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create improved language handling function
CREATE OR REPLACE FUNCTION handle_offer_language()
RETURNS trigger AS $$
BEGIN
  -- Set language based on currency and existing language preference
  NEW.language := CASE
    -- For Brazilian Real, always use Portuguese
    WHEN NEW.currency = 'BRL' THEN 'pt-BR'
    
    -- For Euro, use Spanish
    WHEN NEW.currency = 'EUR' THEN 'es-ES'
    
    -- For USD, respect language preference if it exists
    WHEN NEW.currency = 'USD' THEN
      CASE
        WHEN NEW.language LIKE 'es%' OR NEW.language = 'es' THEN 'es-ES'
        WHEN NEW.language LIKE 'pt%' THEN 'pt-BR'
        ELSE 'en-US'
      END
    
    -- Default to English
    ELSE 'en-US'
  END;

  -- Log offer creation attempt
  INSERT INTO system_logs (
    level,
    category,
    message,
    metadata
  ) VALUES (
    'info',
    'product',
    'Offer creation',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'currency', NEW.currency,
      'language', NEW.language,
      'user_id', auth.uid(),
      'timestamp', now()
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for language handling
CREATE TRIGGER handle_offer_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION handle_offer_language();

-- Grant necessary permissions
GRANT ALL ON offers TO authenticated;
GRANT ALL ON offers TO anon;

-- Update existing offers to ensure correct language
UPDATE offers SET
  language = CASE
    WHEN currency = 'BRL' THEN 'pt-BR'
    WHEN currency = 'EUR' THEN 'es-ES'
    WHEN currency = 'USD' AND language LIKE 'es%' THEN 'es-ES'
    WHEN currency = 'USD' AND language LIKE 'pt%' THEN 'pt-BR'
    ELSE 'en-US'
  END;

-- Add helpful comments
COMMENT ON POLICY "enable_all_operations" ON offers IS 'Allow all operations for authenticated users';
COMMENT ON FUNCTION handle_offer_language IS 'Automatically set appropriate language based on currency and user preference';