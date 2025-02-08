-- Disable RLS temporarily on critical tables
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE pix_payments DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated, anon;
GRANT ALL ON payments TO authenticated, anon;
GRANT ALL ON pix_payments TO authenticated, anon;

-- Create or replace the PIX payment function
CREATE OR REPLACE FUNCTION generate_pix_payment(
  payment_id uuid,
  amount numeric,
  customer_name text,
  customer_document text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mp_response jsonb;
  pix_data jsonb;
BEGIN
  -- Call MercadoPago API to generate PIX
  SELECT content::jsonb INTO mp_response
  FROM http((
    'POST',
    'https://api.mercadopago.com/v1/payments',
    ARRAY[
      ('Authorization', 'Bearer ' || current_setting('app.mercadopago_access_token', true))::http_header,
      ('Content-Type', 'application/json')::http_header
    ],
    'application/json',
    jsonb_build_object(
      'transaction_amount', amount,
      'payment_method_id', 'pix',
      'payer', jsonb_build_object(
        'first_name', split_part(customer_name, ' ', 1),
        'last_name', substr(customer_name, strpos(customer_name, ' ') + 1),
        'identification', jsonb_build_object(
          'type', 'CPF',
          'number', customer_document
        )
      )
    )::text
  ));

  -- Extract PIX data
  pix_data := mp_response->'point_of_interaction'->'transaction_data';

  -- Store PIX details
  INSERT INTO pix_payments (
    payment_id,
    qr_code,
    qr_code_base64,
    copy_paste,
    expires_at
  ) VALUES (
    payment_id,
    pix_data->>'qr_code',
    pix_data->>'qr_code_base64',
    pix_data->>'qr_code',
    now() + interval '30 minutes'
  );

  -- Return PIX data
  RETURN jsonb_build_object(
    'qr_code', pix_data->>'qr_code',
    'qr_code_base64', pix_data->>'qr_code_base64',
    'copy_paste', pix_data->>'qr_code',
    'expires_at', (now() + interval '30 minutes')
  );
END;
$$;

-- Set MercadoPago access token
DO $$
BEGIN
  PERFORM set_config(
    'app.mercadopago_access_token',
    'APP_USR-4913751720075877-062315-a23bd465119a3996b9ffe6e204cb7c62-1641718483',
    false
  );
END $$;