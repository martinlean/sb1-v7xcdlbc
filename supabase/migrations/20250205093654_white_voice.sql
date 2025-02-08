-- Create function to generate Stripe payment intent
CREATE OR REPLACE FUNCTION create_stripe_payment_intent(
  amount numeric,
  currency text,
  customer_email text,
  customer_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stripe_response jsonb;
  payment_id uuid;
BEGIN
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
    currency,
    'pending',
    'card',
    'stripe',
    jsonb_build_object(
      'customer_email', customer_email,
      'customer_name', customer_name
    )
  ) RETURNING id INTO payment_id;

  -- Call Stripe API
  SELECT content::jsonb INTO stripe_response
  FROM http((
    'POST',
    'https://api.stripe.com/v1/payment_intents',
    ARRAY[
      ('Authorization', 'Bearer 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')::http_header,
      ('Content-Type', 'application/json')::http_header,
      ('Stripe-Version', '2023-10-16')::http_header
    ],
    'application/json',
    jsonb_build_object(
      'amount', amount,
      'currency', currency,
      'payment_method_types', ARRAY['card'],
      'metadata', jsonb_build_object(
        'payment_id', payment_id,
        'customer_email', customer_email
      )
    )::text
  ));

  -- Update payment record with Stripe ID
  UPDATE payments
  SET provider_payment_id = stripe_response->>'id'
  WHERE id = payment_id;

  -- Return client secret
  RETURN jsonb_build_object(
    'client_secret', stripe_response->>'client_secret'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Update payment status to failed if it was created
    IF payment_id IS NOT NULL THEN
      UPDATE payments 
      SET status = 'failed', 
          metadata = metadata || jsonb_build_object('error', SQLERRM)
      WHERE id = payment_id;
    END IF;
    RAISE;
END;
$$;