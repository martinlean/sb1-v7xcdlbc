-- Enable the HTTP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Drop existing functions
DROP FUNCTION IF EXISTS create_pix_payment(numeric, text, text);

-- Create new PIX payment function with proper HTTP handling
CREATE OR REPLACE FUNCTION create_pix_payment(
  p_amount numeric,
  p_customer_name text,
  p_customer_document text
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
BEGIN
  -- Clean document number
  clean_document := regexp_replace(p_customer_document, '[^0-9]', '', 'g');

  -- Validate input
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF length(clean_document) NOT IN (11, 14) THEN
    RAISE EXCEPTION 'Invalid document number';
  END IF;

  -- Create payment record
  INSERT INTO payments (
    amount,
    currency,
    status,
    payment_method,
    payment_provider,
    metadata
  ) VALUES (
    p_amount,
    'BRL',
    'pending',
    'pix',
    'mercadopago',
    jsonb_build_object(
      'customer_name', p_customer_name,
      'customer_document', clean_document
    )
  ) RETURNING id INTO payment_id;

  -- Call MercadoPago API with error handling
  BEGIN
    SELECT content::jsonb INTO mp_response
    FROM extensions.http((
      'POST',
      'https://api.mercadopago.com/v1/payments',
      ARRAY[
        ('Authorization', 'Bearer APP_USR-4913751720075877-062315-a23bd465119a3996b9ffe6e204cb7c62-1641718483')::http_header,
        ('Content-Type', 'application/json')::http_header
      ],
      'application/json',
      jsonb_build_object(
        'transaction_amount', p_amount,
        'payment_method_id', 'pix',
        'payer', jsonb_build_object(
          'first_name', split_part(p_customer_name, ' ', 1),
          'last_name', substr(p_customer_name, strpos(p_customer_name, ' ') + 1),
          'identification', jsonb_build_object(
            'type', CASE WHEN length(clean_document) = 11 THEN 'CPF' ELSE 'CNPJ' END,
            'number', clean_document
          )
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
      'id', payment_id,
      'qr_code', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      'qr_code_base64', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code_base64',
      'copy_paste', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      'expires_at', (now() + interval '30 minutes')
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Update payment status to failed
      UPDATE payments SET status = 'failed', metadata = metadata || jsonb_build_object('error', SQLERRM)
      WHERE id = payment_id;
      RAISE;
  END;
END;
$$;