-- Create function to get appropriate language for currency and country
CREATE OR REPLACE FUNCTION get_checkout_language_v2(
  p_currency text,
  p_country_code text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_language text;
BEGIN
  -- Set language based on currency first
  v_language := CASE UPPER(TRIM(p_currency))
    WHEN 'BRL' THEN 'pt-BR'
    WHEN 'EUR' THEN 'es-ES'
    ELSE 'en-US'
  END;

  -- Override with country-specific language for USD
  IF UPPER(TRIM(p_currency)) = 'USD' AND p_country_code IS NOT NULL THEN
    v_language := CASE UPPER(p_country_code)
      WHEN 'BR' THEN 'pt-BR'
      WHEN 'ES' THEN 'es-ES'
      ELSE 'en-US'
    END;
  END IF;

  RETURN v_language;
END;
$$;

-- Create function to handle offer language
CREATE OR REPLACE FUNCTION handle_offer_language_v2()
RETURNS trigger AS $$
BEGIN
  -- Keep original currency
  NEW.currency := UPPER(TRIM(NEW.currency));
  
  -- Set language based on currency but preserve Spanish if selected
  IF NEW.language SIMILAR TO 'es%' OR NEW.language = 'es' THEN
    NEW.language := 'es-ES';
  ELSE
    NEW.language := get_checkout_language_v2(NEW.currency);
  END IF;

  -- Log the language selection
  INSERT INTO system_logs (
    level,
    category,
    message,
    metadata
  ) VALUES (
    'info',
    'product',
    'Offer language set',
    jsonb_build_object(
      'offer_id', NEW.id,
      'currency', NEW.currency,
      'language', NEW.language,
      'original_language', CASE WHEN TG_OP = 'UPDATE' THEN OLD.language ELSE NULL END
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for language handling
DROP TRIGGER IF EXISTS handle_offer_language_trigger ON offers;
CREATE TRIGGER handle_offer_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION handle_offer_language_v2();

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
COMMENT ON FUNCTION get_checkout_language_v2 IS 'Get appropriate checkout language based on currency and country';
COMMENT ON FUNCTION handle_offer_language_v2 IS 'Automatically handle offer language while preserving currency';