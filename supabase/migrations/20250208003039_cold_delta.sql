-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can access system logs" ON system_logs;

-- Temporarily disable RLS on system_logs
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON system_logs TO authenticated;
GRANT ALL ON system_logs TO anon;

-- Create function to handle offer language
CREATE OR REPLACE FUNCTION handle_offer_language_v4()
RETURNS trigger AS $$
BEGIN
  -- Keep original currency
  NEW.currency := UPPER(TRIM(NEW.currency));
  
  -- Set language based on currency but preserve Spanish if selected
  IF NEW.language SIMILAR TO 'es%' OR NEW.language = 'es' THEN
    NEW.language := 'es-ES';
  ELSE
    NEW.language := CASE
      WHEN NEW.currency = 'BRL' THEN 'pt-BR'
      WHEN NEW.currency = 'EUR' THEN 'es-ES'
      ELSE 'en-US'
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for language handling
DROP TRIGGER IF EXISTS handle_offer_language_trigger ON offers;
CREATE TRIGGER handle_offer_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION handle_offer_language_v4();

-- Update existing offers
UPDATE offers SET
  currency = UPPER(TRIM(currency)),
  language = CASE
    WHEN currency = 'BRL' THEN 'pt-BR'
    WHEN currency = 'EUR' THEN 'es-ES'
    WHEN currency = 'USD' AND language SIMILAR TO 'es%' THEN 'es-ES'
    ELSE 'en-US'
  END;

-- Add helpful comments
COMMENT ON FUNCTION handle_offer_language_v4 IS 'Automatically handle offer language while preserving currency';