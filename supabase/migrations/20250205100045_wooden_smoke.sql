-- Drop existing function
DROP FUNCTION IF EXISTS public.create_stripe_payment_intent(numeric, text, text, text);

-- Create improved Stripe payment intent function with proper content type handling
CREATE OR REPLACE FUNCTION public.create_stripe_payment_intent(
  amount numeric,
  currency text,
  customer_email text,
  customer_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stripe_response jsonb;
  payment_id uuid;
  normalized_currency text;
  stripe_amount integer;
  request_body text;
BEGIN
  -- Validate input
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Normalize currency to lowercase
  normalized_currency := lower(currency);
  
  -- Validate currency
  IF normalized_currency NOT IN ('brl', 'usd', 'eur') THEN
    RAISE EXCEPTION 'Invalid currency. Supported currencies are: BRL, USD, EUR';
  END IF;

  -- Convert amount to cents
  stripe_amount := (amount * 100)::integer;

  -- Create payment record
  INSERT INTO payments (
    amount,
    currency,
    status,
    payment_method,
    payment_provider,
    metadata
  ) VALUES (
    amount,
    normalized_currency,
    'pending',
    'card',
    'stripe',
    jsonb_build_object(
      'customer_email', customer_email,
      'customer_name', customer_name,
      'payment_type', 'card'
    )
  ) RETURNING id INTO payment_id;

  -- Prepare request body as URL-encoded form data
  request_body := 
    'amount=' || stripe_amount::text || 
    '&currency=' || normalized_currency ||
    '&automatic_payment_methods[enabled]=true' ||
    '&metadata[payment_id]=' || payment_id::text ||
    '&metadata[customer_email]=' || customer_email ||
    '&metadata[customer_name]=' || customer_name ||
    '&receipt_email=' || customer_email ||
    '&description=' || 'Payment for ' || customer_name;

  -- Call Stripe API
  BEGIN
    -- Make the API request with proper content type
    SELECT content::jsonb INTO stripe_response
    FROM http((
      'POST',
      'https://api.stripe.com/v1/payment_intents',
      ARRAY[
        ('Authorization', 'Bearer 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'),
        ('Content-Type', 'application/x-www-form-urlencoded')
      ]::http_header[],
      'application/x-www-form-urlencoded',
      request_body
    ));

    -- Check for Stripe error response
    IF stripe_response ? 'error' THEN
      RAISE EXCEPTION 'Stripe error: %', stripe_response->'error'->>'message';
    END IF;

    -- Validate required fields in response
    IF stripe_response->>'id' IS NULL OR stripe_response->>'client_secret' IS NULL THEN
      RAISE EXCEPTION 'Invalid Stripe response: missing required fields';
    END IF;

    -- Update payment record with Stripe ID
    UPDATE payments
    SET 
      provider_payment_id = stripe_response->>'id',
      metadata = metadata || jsonb_build_object(
        'stripe_payment_intent_id', stripe_response->>'id',
        'stripe_client_secret', stripe_response->>'client_secret'
      )
    WHERE id = payment_id;

    -- Return success response
    RETURN jsonb_build_object(
      'client_secret', stripe_response->>'client_secret',
      'payment_id', payment_id,
      'publishable_key', 'pk_live_51OSh71JaNghssXXxkhjvslPULVIO3zWwV6SP7iLlivYpvfrNgx8Qyyjzi6tze2ZQ5STbcdkpRJXZlukLyF70IWmd00UT1cizDg'
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Update payment status to failed
      UPDATE payments 
      SET 
        status = 'failed', 
        metadata = metadata || jsonb_build_object(
          'error', SQLERRM,
          'error_details', stripe_response
        )
      WHERE id = payment_id;
      
      -- Re-raise the exception
      RAISE EXCEPTION 'Failed to create Stripe payment intent: %', SQLERRM;
  END;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;