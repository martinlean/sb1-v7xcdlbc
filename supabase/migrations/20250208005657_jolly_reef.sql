-- Create function to handle upsell payment
CREATE OR REPLACE FUNCTION create_upsell_payment(
  p_offer_id uuid,
  p_original_payment_intent_id text,
  p_payment_method_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_original_payment record;
  v_stripe_response jsonb;
BEGIN
  -- Get offer details
  SELECT o.*, p.payment_settings
  INTO v_offer
  FROM offers o
  JOIN products p ON p.id = o.product_id
  WHERE o.id = p_offer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  -- Get original payment details
  SELECT *
  INTO v_original_payment
  FROM payments
  WHERE provider_payment_id = p_original_payment_intent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original payment not found';
  END IF;

  -- Create Stripe payment intent
  SELECT content::jsonb INTO v_stripe_response
  FROM http((
    'POST',
    'https://api.stripe.com/v1/payment_intents',
    ARRAY[
      ('Authorization', 'Bearer ' || v_offer.payment_settings->>'secret_key'),
      ('Content-Type', 'application/x-www-form-urlencoded')
    ]::http_header[],
    'application/x-www-form-urlencoded',
    'amount=' || (v_offer.price * 100)::text ||
    '&currency=' || v_offer.currency ||
    '&payment_method=' || p_payment_method_id ||
    '&off_session=true' ||
    '&confirm=true' ||
    '&metadata[original_payment_intent_id]=' || p_original_payment_intent_id ||
    '&metadata[offer_id]=' || p_offer_id
  ));

  -- Return client secret
  RETURN jsonb_build_object(
    'client_secret', v_stripe_response->>'client_secret'
  );
END;
$$;

-- Create function to handle downsell payment
CREATE OR REPLACE FUNCTION create_downsell_payment(
  p_offer_id uuid,
  p_original_payment_intent_id text,
  p_payment_method_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_original_payment record;
  v_stripe_response jsonb;
BEGIN
  -- Get offer details
  SELECT o.*, p.payment_settings
  INTO v_offer
  FROM offers o
  JOIN products p ON p.id = o.product_id
  WHERE o.id = p_offer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  -- Get original payment details
  SELECT *
  INTO v_original_payment
  FROM payments
  WHERE provider_payment_id = p_original_payment_intent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original payment not found';
  END IF;

  -- Create Stripe payment intent
  SELECT content::jsonb INTO v_stripe_response
  FROM http((
    'POST',
    'https://api.stripe.com/v1/payment_intents',
    ARRAY[
      ('Authorization', 'Bearer ' || v_offer.payment_settings->>'secret_key'),
      ('Content-Type', 'application/x-www-form-urlencoded')
    ]::http_header[],
    'application/x-www-form-urlencoded',
    'amount=' || (v_offer.price * 100)::text ||
    '&currency=' || v_offer.currency ||
    '&payment_method=' || p_payment_method_id ||
    '&off_session=true' ||
    '&confirm=true' ||
    '&metadata[original_payment_intent_id]=' || p_original_payment_intent_id ||
    '&metadata[offer_id]=' || p_offer_id ||
    '&metadata[type]=downsell'
  ));

  -- Return client secret
  RETURN jsonb_build_object(
    'client_secret', v_stripe_response->>'client_secret'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_upsell_payment TO authenticated;
GRANT EXECUTE ON FUNCTION create_downsell_payment TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION create_upsell_payment IS 'Create a payment intent for upsell offer';
COMMENT ON FUNCTION create_downsell_payment IS 'Create a payment intent for downsell offer';