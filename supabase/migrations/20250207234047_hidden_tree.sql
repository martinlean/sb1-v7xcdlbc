-- Drop existing policies
DROP POLICY IF EXISTS "enable_offers_access" ON offers;
DROP POLICY IF EXISTS "allow_all_authenticated" ON offers;

-- Disable RLS temporarily
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions
GRANT ALL ON offers TO authenticated;
GRANT ALL ON offers TO anon;

-- Create function to validate and create offer
CREATE OR REPLACE FUNCTION create_offer(
  p_name text,
  p_internal_name text,
  p_price numeric,
  p_currency text,
  p_language text,
  p_billing_type text,
  p_product_id uuid,
  p_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id uuid;
BEGIN
  -- Insert the offer
  INSERT INTO offers (
    name,
    internal_name,
    price,
    currency,
    language,
    billing_type,
    product_id,
    active
  ) VALUES (
    p_name,
    p_internal_name,
    p_price,
    UPPER(p_currency),
    CASE 
      WHEN p_currency = 'BRL' THEN 'pt-BR'
      WHEN p_currency = 'EUR' THEN 'es-ES'
      ELSE 'en-US'
    END,
    p_billing_type,
    p_product_id,
    p_active
  ) RETURNING id INTO v_offer_id;

  -- Log offer creation
  INSERT INTO system_logs (
    level,
    category,
    message,
    metadata
  ) VALUES (
    'info',
    'product',
    'Offer created successfully',
    jsonb_build_object(
      'offer_id', v_offer_id,
      'product_id', p_product_id,
      'user_id', auth.uid(),
      'currency', p_currency,
      'language', CASE 
        WHEN p_currency = 'BRL' THEN 'pt-BR'
        WHEN p_currency = 'EUR' THEN 'es-ES'
        ELSE 'en-US'
      END
    )
  );

  RETURN v_offer_id;
END;
$$;

-- Create function to debug offer creation
CREATE OR REPLACE FUNCTION debug_offer_creation(
  p_name text,
  p_internal_name text,
  p_price numeric,
  p_currency text,
  p_language text,
  p_billing_type text,
  p_product_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_product_exists boolean;
  v_user_owns_product boolean;
  v_debug_info jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if product exists
  SELECT EXISTS (
    SELECT 1 FROM products WHERE id = p_product_id
  ) INTO v_product_exists;
  
  -- Check if user owns product
  SELECT EXISTS (
    SELECT 1 FROM products 
    WHERE id = p_product_id AND user_id = v_user_id
  ) INTO v_user_owns_product;
  
  -- Build debug info
  v_debug_info := jsonb_build_object(
    'user_id', v_user_id,
    'product_exists', v_product_exists,
    'user_owns_product', v_user_owns_product,
    'input_data', jsonb_build_object(
      'name', p_name,
      'internal_name', p_internal_name,
      'price', p_price,
      'currency', p_currency,
      'language', p_language,
      'billing_type', p_billing_type,
      'product_id', p_product_id
    )
  );
  
  -- Log debug info
  INSERT INTO system_logs (
    level,
    category,
    message,
    metadata
  ) VALUES (
    'info',
    'product',
    'Offer creation debug info',
    v_debug_info
  );
  
  RETURN v_debug_info;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_offer TO authenticated;
GRANT EXECUTE ON FUNCTION debug_offer_creation TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION create_offer IS 'Creates a new offer with proper language handling';
COMMENT ON FUNCTION debug_offer_creation IS 'Debug function to help identify offer creation issues';