-- Drop existing function
DROP FUNCTION IF EXISTS public.create_pix_payment(numeric, text, text, text);

-- Create improved PIX payment function
CREATE OR REPLACE FUNCTION public.create_pix_payment(
  p_amount numeric,
  p_customer_name text,
  p_customer_document text,
  p_customer_email text,
  p_expiration_minutes int DEFAULT 30
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
BEGIN
  -- Validate input
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Clean and validate document
  clean_document := regexp_replace(p_customer_document, '[^0-9]', '', 'g');
  IF length(clean_document) NOT IN (11, 14) THEN
    RAISE EXCEPTION 'Invalid document number';
  END IF;

  -- Create payment record with new fields
  INSERT INTO payments (
    amount,
    currency,
    payment_processor,
    payment_type,
    payment_status,
    metadata
  ) VALUES (
    p_amount,
    'brl',
    'mercadopago',
    'pix',
    'pending',
    jsonb_build_object(
      'customer_email', p_customer_email,
      'customer_name', p_customer_name,
      'customer_document', clean_document,
      'expiration_minutes', p_expiration_minutes
    )
  ) RETURNING id INTO payment_id;

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

  -- Call MercadoPago API
  BEGIN
    SELECT content::jsonb INTO mp_response
    FROM http((
      'POST',
      'https://api.mercadopago.com/v1/payments',
      ARRAY[
        ('Authorization', 'Bearer APP_USR-4913751720075877-062315-a23bd465119a3996b9ffe6e204cb7c62-1641718483'),
        ('Content-Type', 'application/json')
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
      now() + (p_expiration_minutes * interval '1 minute')
    );

    -- Return PIX data
    RETURN jsonb_build_object(
      'payment_id', payment_id,
      'qr_code', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      'qr_code_base64', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code_base64',
      'copy_paste', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
      'expires_at', (now() + (p_expiration_minutes * interval '1 minute'))
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Update payment status to failed
      UPDATE payments 
      SET 
        payment_status = 'failed', 
        metadata = metadata || jsonb_build_object(
          'error', SQLERRM,
          'error_details', mp_response
        )
      WHERE id = payment_id;
      
      -- Re-raise the exception
      RAISE EXCEPTION 'Failed to create PIX payment: %', SQLERRM;
  END;
END;
$$;