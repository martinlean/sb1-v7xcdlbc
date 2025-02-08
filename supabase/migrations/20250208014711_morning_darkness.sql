-- First drop existing triggers
DROP TRIGGER IF EXISTS handle_offer_language_trigger ON offers;

-- Then drop existing functions
DROP FUNCTION IF EXISTS get_checkout_language_v2;
DROP FUNCTION IF EXISTS get_checkout_language_v3;
DROP FUNCTION IF EXISTS handle_offer_language_v2;
DROP FUNCTION IF EXISTS handle_offer_language_v3;
DROP FUNCTION IF EXISTS handle_offer_language_v4;

-- Create improved language detection function
CREATE OR REPLACE FUNCTION get_device_language(
  p_browser_language text,
  p_currency text DEFAULT NULL,
  p_country_code text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try browser language if it's in a supported format
  IF p_browser_language ~ '^(pt-BR|en-US|en-GB|en-AU|en-CA|es-ES|es-MX|fr-FR|de-DE|it-IT)$' THEN
    RETURN p_browser_language;
  END IF;

  -- Extract base language code
  DECLARE
    base_lang text := split_part(p_browser_language, '-', 1);
  BEGIN
    -- Map base language to default variant
    RETURN CASE lower(base_lang)
      WHEN 'pt' THEN 'pt-BR'
      WHEN 'en' THEN 'en-US'
      WHEN 'es' THEN 'es-ES'
      WHEN 'fr' THEN 'fr-FR'
      WHEN 'de' THEN 'de-DE'
      WHEN 'it' THEN 'it-IT'
      -- If no match, fallback based on currency
      ELSE CASE UPPER(p_currency)
        WHEN 'BRL' THEN 'pt-BR'
        WHEN 'EUR' THEN 'en-EU'
        ELSE 'en-US'
      END
    END;
  END;
END;
$$;

-- Create trigger function to handle offer language
CREATE OR REPLACE FUNCTION handle_offer_language()
RETURNS trigger AS $$
BEGIN
  -- Keep original currency
  NEW.currency := UPPER(TRIM(NEW.currency));

  -- Set language based on browser language if provided in metadata
  IF NEW.metadata ? 'browser_language' THEN
    NEW.language := get_device_language(
      NEW.metadata->>'browser_language',
      NEW.currency
    );
  ELSE
    -- Fallback to currency-based language
    NEW.language := CASE NEW.currency
      WHEN 'BRL' THEN 'pt-BR'
      WHEN 'EUR' THEN 'en-EU'
      ELSE 'en-US'
    END;
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
COMMENT ON FUNCTION get_device_language IS 'Get appropriate language based on browser language with currency fallback';
COMMENT ON FUNCTION handle_offer_language IS 'Set offer language based on browser language or currency';