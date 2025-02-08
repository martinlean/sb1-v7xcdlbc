-- First remove existing language constraint
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Add new language constraint with comprehensive language support
ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN (
    -- English variants
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ', 'en-IE', 'en-ZA', 'en-IN',
    -- Spanish variants
    'es-ES', 'es-MX', 'es-AR', 'es-CL', 'es-CO', 'es-PE', 'es-VE', 'es-EC', 
    'es-CR', 'es-PA', 'es-DO', 'es-UY', 'es-PY', 'es-BO', 'es-SV', 'es-HN',
    'es-NI', 'es-PR', 'es-GT',
    -- Portuguese variants
    'pt-BR', 'pt-PT'
  )
);

-- Create function to get appropriate language based on user's country
CREATE OR REPLACE FUNCTION get_checkout_language(country_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN CASE
    -- Spanish-speaking countries
    WHEN country_code IN ('ES') THEN 'es-ES'
    WHEN country_code IN ('MX') THEN 'es-MX'
    WHEN country_code IN ('AR') THEN 'es-AR'
    WHEN country_code IN ('CL') THEN 'es-CL'
    WHEN country_code IN ('CO') THEN 'es-CO'
    WHEN country_code IN ('PE') THEN 'es-PE'
    WHEN country_code IN ('VE') THEN 'es-VE'
    WHEN country_code IN ('EC') THEN 'es-EC'
    WHEN country_code IN ('CR') THEN 'es-CR'
    WHEN country_code IN ('PA') THEN 'es-PA'
    WHEN country_code IN ('DO') THEN 'es-DO'
    WHEN country_code IN ('UY') THEN 'es-UY'
    WHEN country_code IN ('PY') THEN 'es-PY'
    WHEN country_code IN ('BO') THEN 'es-BO'
    WHEN country_code IN ('SV') THEN 'es-SV'
    WHEN country_code IN ('HN') THEN 'es-HN'
    WHEN country_code IN ('NI') THEN 'es-NI'
    WHEN country_code IN ('PR') THEN 'es-PR'
    WHEN country_code IN ('GT') THEN 'es-GT'
    
    -- English-speaking countries
    WHEN country_code IN ('US') THEN 'en-US'
    WHEN country_code IN ('GB', 'UK') THEN 'en-GB'
    WHEN country_code IN ('AU') THEN 'en-AU'
    WHEN country_code IN ('CA') THEN 'en-CA'
    WHEN country_code IN ('NZ') THEN 'en-NZ'
    WHEN country_code IN ('IE') THEN 'en-IE'
    WHEN country_code IN ('ZA') THEN 'en-ZA'
    WHEN country_code IN ('IN') THEN 'en-IN'
    
    -- Portuguese-speaking countries
    WHEN country_code IN ('BR') THEN 'pt-BR'
    WHEN country_code IN ('PT') THEN 'pt-PT'
    
    -- Default to US English if country not matched
    ELSE 'en-US'
  END;
END;
$$;

-- Add helpful comments
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported interface languages for checkout based on user location';
COMMENT ON FUNCTION get_checkout_language IS 'Function to determine appropriate checkout language based on user country code';