-- Drop existing language handling functions and triggers
DROP TRIGGER IF EXISTS handle_offer_language_trigger ON offers;
DROP FUNCTION IF EXISTS handle_offer_language();
DROP FUNCTION IF EXISTS get_device_language();

-- Create improved language detection function
CREATE OR REPLACE FUNCTION get_user_language(
  p_browser_language text,
  p_country_code text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try exact browser language match
  IF p_browser_language ~ '^(pt-BR|en-US|en-GB|en-AU|en-CA|es-ES)$' THEN
    RETURN p_browser_language;
  END IF;

  -- Extract base language code
  DECLARE
    base_lang text := split_part(p_browser_language, '-', 1);
  BEGIN
    -- Map base language to default variant
    RETURN CASE lower(base_lang)
      WHEN 'pt' THEN 'pt-BR'
      WHEN 'es' THEN 'es-ES'
      WHEN 'en' THEN CASE UPPER(p_country_code)
        WHEN 'GB' THEN 'en-GB'
        WHEN 'AU' THEN 'en-AU'
        WHEN 'CA' THEN 'en-CA'
        ELSE 'en-US'
      END
      ELSE 'en-US'
    END;
  END;
END;
$$;

-- Create function to handle offer language
CREATE OR REPLACE FUNCTION handle_offer_language()
RETURNS trigger AS $$
BEGIN
  -- Keep original currency
  NEW.currency := UPPER(TRIM(NEW.currency));

  -- Set language based on browser language if provided in metadata
  IF NEW.metadata ? 'browser_language' THEN
    NEW.language := get_user_language(
      NEW.metadata->>'browser_language',
      NEW.metadata->>'country_code'
    );
  ELSE
    -- Fallback to browser language from request context if available
    NEW.language := get_user_language(
      current_setting('request.headers', true)::jsonb->>'accept-language',
      current_setting('request.headers', true)::jsonb->>'cf-ipcountry'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER handle_offer_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION handle_offer_language();

-- Add helpful comments
COMMENT ON FUNCTION get_user_language IS 'Get appropriate language based on browser language and country';
COMMENT ON FUNCTION handle_offer_language IS 'Set offer language based on user preferences';