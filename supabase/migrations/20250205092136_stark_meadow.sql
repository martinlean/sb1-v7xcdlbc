-- Create or replace the PIX payment function
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
    'BRL',
    'pending',
    'pix',
    'mercadopago',
    jsonb_build_object(
      'customer_email', customer_email,
      'customer_name', customer_name,
      'customer_document', customer_document
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
      'transaction_amount', amount,
      'payment_method_id', 'pix',
      'payer', jsonb_build_object(
        'email', customer_email,
        'first_name', split_part(customer_name, ' ', 1),
        'last_name', substr(customer_name, strpos(customer_name, ' ') + 1),
        'identification', jsonb_build_object(
          'type', 'CPF',
          'number', regexp_replace(customer_document, '[^0-9]', '', 'g')
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
    'payment_id', payment_id,
    'qr_code', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
    'qr_code_base64', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code_base64',
    'copy_paste', mp_response->'point_of_interaction'->'transaction_data'->>'qr_code',
    'expires_at', (now() + interval '30 minutes')
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