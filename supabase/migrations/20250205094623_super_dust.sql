-- Add valid currency check constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE payments ADD CONSTRAINT valid_currency CHECK (currency IN ('brl', 'usd', 'eur'));

-- Drop existing functions
DROP FUNCTION IF EXISTS public.generate_pix_payment(text, text, text, numeric);
DROP FUNCTION IF EXISTS public.create_stripe_payment_intent(numeric, text, text, text);

-- Create improved PIX payment function
CREATE OR REPLACE FUNCTION public.generate_pix_payment(
  customer_email text,
  customer_name text,
  customer_document text,
  amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mp_response jsonb;
  payment_id uuid;
  clean_document text;
  current_user_id uuid;
BEGIN
  -- Get current user ID or use a default system user ID
  current_user_id := coalesce(
    auth.uid(),
    '00000000-0000-0000-0000-000000000000'::uuid
  );

  -- Validate input
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Clean and validate document
  clean_document := regexp_replace(customer_document, '[^0-9]', '', 'g');
  IF length(clean_document) NOT IN (11, 14) THEN
    RAISE EXCEPTION 'Invalid document number';
  END IF;

  -- Create payment record
  INSERT INTO payments (
    user_id,
    amount,
    currency,
    status,
    payment_method,
    payment_provider,
    metadata
  ) VALUES (
    current_user_id,
    amount,
    'brl', -- Always BRL for PIX
    'pending',
    'pix',
    'mercadopago',
    jsonb_build_object(
      'customer_email', customer_email,
      'customer_name', customer_name,
      'customer_document', clean_document,
      'payment_type', 'pix'
    )
  ) RETURNING id INTO payment_id;

  -- Call MercadoPago API
  BEGIN
    SELECT content::jsonb INTO mp_response
    FROM http((
      'POST',
      'https://api.mercadopago.com/v1/payments',
      ARRAY[
        ('Authorization', 'Bearer APP_USR-4913751720075877-062315-a23bd465119a3996b9ffe6e204cb7c62-1641718483')::http_header,
        ('Content-Type', 'application/json')::http_header
      ],
      'application/json',
      jsonb_build_object(
        'transaction_amount', amount,
        'payment_method_id', 'pix',
        'payer', jsonb_build_object(
          'email', customer_email,
          'first_name', split_part(customer_name, ' ', 1),
          'last_name', substr(customer_name, strpos(customer_name, ' ') + 1),
          'identification', jsonb_build_object(
            'type', CASE WHEN length(clean_document) = 11 THEN 'CPF' ELSE 'CNPJ' END,
            'number', clean_document
          )
        ),
        'metadata', jsonb_build_object(
          'payment_id', payment_id
        )
      )::text
    ));

    -- Verify MercadoPago response
    IF mp_response IS NULL OR mp_response->>'status' = 'error' THEN
      RAISE EXCEPTION 'MercadoPago API error: %', coalesce(mp_response->>'message', 'Unknown error');
    END IF;

    -- Store PIX details
    INSERT INTO pix_payments (
      payment_id,
      qr_code,
      qr_code_base64,
      copy_paste,
      expires_at
    ) VALUES (
      payment_id,
      mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      mp_response->'point_of_interaction'->'transaction_data'->>'qr_code_base64',
      mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      now() + interval '30 minutes'
    );

    -- Return PIX data
    RETURN jsonb_build_object(
      'payment_id', payment_id,
      'qr_code', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      'qr_code_base64', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code_base64',
      'copy_paste', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      'expires_at', (now() + interval '30 minutes')
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Update payment status to failed
      UPDATE payments 
      SET status = 'failed', 
          metadata = metadata || jsonb_build_object('error', SQLERRM)
      WHERE id = payment_id;
      RAISE;
  END;
END;
$$;

-- Create improved Stripe payment intent function
CREATE OR REPLACE FUNCTION public.create_stripe_payment_intent(
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
  current_user_id uuid;
  normalized_currency text;
BEGIN
  -- Get current user ID or use a default system user ID
  current_user_id := coalesce(
    auth.uid(),
    '00000000-0000-0000-0000-000000000000'::uuid
  );

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

  -- Create payment record
  INSERT INTO payments (
    user_id,
    amount,
    currency,
    status,
    payment_method,
    payment_provider,
    metadata
  ) VALUES (
    current_user_id,
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

  -- Call Stripe API
  BEGIN
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
        'amount', (amount * 100)::integer, -- Convert to cents
        'currency', normalized_currency,
        'payment_method_types', ARRAY['card'],
        'metadata', jsonb_build_object(
          'payment_id', payment_id,
          'customer_email', customer_email,
          'customer_name', customer_name
        ),
        'receipt_email', customer_email
      )::text
    ));

    -- Validate Stripe response
    IF stripe_response->>'error' IS NOT NULL THEN
      RAISE EXCEPTION 'Stripe error: %', stripe_response->'error'->>'message';
    END IF;

    -- Update payment record with Stripe ID
    UPDATE payments
    SET provider_payment_id = stripe_response->>'id'
    WHERE id = payment_id;

    -- Return client secret
    RETURN jsonb_build_object(
      'client_secret', stripe_response->>'client_secret',
      'payment_id', payment_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Update payment status to failed
      UPDATE payments 
      SET status = 'failed', 
          metadata = metadata || jsonb_build_object('error', SQLERRM)
      WHERE id = payment_id;
      RAISE;
  END;
END;
$$;