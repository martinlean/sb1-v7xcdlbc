-- Create function to handle language fallback
CREATE OR REPLACE FUNCTION get_offer_language(
  p_currency text,
  p_requested_language text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First try to match currency with appropriate language
  RETURN CASE
    WHEN p_currency = 'BRL' THEN 'pt-BR'
    WHEN p_currency = 'EUR' THEN 'es-ES'
    WHEN p_currency = 'USD' AND p_requested_language = 'es' THEN 'es-ES'
    ELSE 'en-US'
  END;
END;
$$;

-- Update offers table to use language fallback
CREATE OR REPLACE FUNCTION set_offer_language()
RETURNS trigger AS $$
BEGIN
  -- Set language based on currency if not provided
  IF NEW.language IS NULL OR NEW.language = '' THEN
    NEW.language := get_offer_language(NEW.currency);
  END IF;

  -- Force Spanish for EUR currency
  IF NEW.currency = 'EUR' THEN
    NEW.language := 'es-ES';
  END IF;

  -- Handle Spanish language variations
  IF NEW.language LIKE 'es%' THEN
    NEW.language := 'es-ES';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for language handling
DROP TRIGGER IF EXISTS set_offer_language_trigger ON offers;
CREATE TRIGGER set_offer_language_trigger
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION set_offer_language();