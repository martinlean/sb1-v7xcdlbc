-- Drop existing functions
DROP FUNCTION IF EXISTS public.generate_pix_payment_v4(numeric, text, text, text);
DROP FUNCTION IF EXISTS public.generate_pix_payment_v3(numeric, text, text, text);
DROP FUNCTION IF EXISTS public.generate_pix_payment_v2(numeric, text, text, text);

-- Create simplified PIX payment function
CREATE OR REPLACE FUNCTION public.create_pix_payment_v1(
  p_amount numeric,
  p_customer_name text,
  p_customer_document text,
  p_customer_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  mp_response jsonb;
  payment_id uuid;
  clean_document text;
  request_body jsonb;
  idempotency_key text;
BEGIN
  -- Generate a unique idempotency key
  idempotency_key := gen_random_uuid()::text;

  -- Clean document number
  clean_document := regexp_replace(p_customer_document, '[^0-9]', '', 'g');

  -- Prepare request body
  request_body := jsonb_build_object(
    'transaction_amount', p_amount,
    'description', format('Payment from %s', p_customer_name),
    'payment_method_id', 'pix',
    'payer', jsonb_build_object(
      'email', p_customer_email,
      'first_name', split_part(p_customer_name, ' ', 1),
      'last_name', substr(p_customer_name, strpos(p_customer_name, ' ') + 1),
      'identification', jsonb_build_object(
        'type', CASE WHEN length(clean_document) = 11 THEN 'CPF' ELSE 'CNPJ' END,
        'number', clean_document
      )
    )
  );

  -- Call MercadoPago API first
  SELECT content::jsonb INTO mp_response
  FROM http((
    'POST',
    'https://api.mercadopago.com/v1/payments',
    ARRAY[
      ('Authorization', 'Bearer APP_USR-4913751720075877-062315-a23bd465119a3996b9ffe6e204cb7c62-1641718483'),
      ('Content-Type', 'application/json'),
      ('X-Idempotency-Key', idempotency_key)
    ]::http_header[],
    'application/json',
    request_body::text
  ));

  -- Check for API error
  IF mp_response ? 'error' OR mp_response->'point_of_interaction' IS NULL THEN
    RAISE EXCEPTION 'MercadoPago error: %', coalesce(
      mp_response->>'message',
      mp_response->'error'->>'message',
      'Unknown error'
    );
  END IF;

  -- If API call succeeded, create payment record
  INSERT INTO payments (
    amount,
    currency,
    status,
    payment_method,
    payment_provider,
    metadata
  ) VALUES (
    p_amount,
    'brl',
    'pending',
    'pix',
    'mercadopago',
    jsonb_build_object(
      'customer_email', p_customer_email,
      'customer_name', p_customer_name,
      'customer_document', clean_document,
      'payment_type', 'pix',
      'mercadopago_id', mp_response->>'id'
    )
  ) RETURNING id INTO payment_id;

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
    -- If we have a payment_id, update its status to failed
    IF payment_id IS NOT NULL THEN
      UPDATE payments 
      SET 
        status = 'failed', 
        metadata = metadata || jsonb_build_object(
          'error', SQLERRM,
          'error_details', mp_response
        )
      WHERE id = payment_id;
    END IF;
    
    -- Re-raise the exception
    RAISE EXCEPTION 'Failed to create PIX payment: %', SQLERRM;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_pix_payment_v1 TO anon;
GRANT EXECUTE ON FUNCTION public.create_pix_payment_v1 TO authenticated;

-- Ensure RLS is disabled for these tables
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE pix_payments DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to both roles
GRANT ALL ON payments TO anon;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON pix_payments TO anon;
GRANT ALL ON pix_payments TO authenticated;