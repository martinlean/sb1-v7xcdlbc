-- Drop existing function with all possible parameter combinations
DROP FUNCTION IF EXISTS generate_pix_payment(numeric, text, text);
DROP FUNCTION IF EXISTS generate_pix_payment(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS generate_pix_payment(payment_id uuid, amount numeric, customer_name text, customer_document text);

-- Create new function with unique name and clear parameter types
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
    p_amount,
    'BRL',
    'pending',
    'pix',
    'mercadopago',
    jsonb_build_object(
      'customer_name', p_customer_name,
      'customer_document', p_customer_document
    )
  ) RETURNING id INTO payment_id;

  -- Call MercadoPago API
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
      'transaction_amount', p_amount,
      'payment_method_id', 'pix',
      'payer', jsonb_build_object(
        'first_name', split_part(p_customer_name, ' ', 1),
        'last_name', substr(p_customer_name, strpos(p_customer_name, ' ') + 1),
        'identification', jsonb_build_object(
          'type', 'CPF',
          'number', regexp_replace(p_customer_document, '[^0-9]', '', 'g')
        )
      )
    )::text
  ));

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
END;
$$;