-- Create function to generate PIX payment
CREATE OR REPLACE FUNCTION generate_pix_payment(
  offer_id uuid,
  customer_email text,
  customer_name text,
  customer_document text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offer_data record;
  payment_id uuid;
  mercadopago_response jsonb;
BEGIN
  -- Get offer details
  SELECT o.*, p.user_id
  INTO offer_data
  FROM offers o
  JOIN products p ON p.id = o.product_id
  WHERE o.id = offer_id AND o.active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found or inactive';
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
    offer_data.user_id,
    offer_data.price,
    offer_data.currency,
    'pending',
    'pix',
    'mercadopago',
    jsonb_build_object(
      'offer_id', offer_id,
      'customer_email', customer_email,
      'customer_name', customer_name,
      'customer_document', customer_document
    )
  ) RETURNING id INTO payment_id;

  -- Generate PIX via MercadoPago API
  SELECT
    content::jsonb INTO mercadopago_response
  FROM
    http((
      'POST',
      'https://api.mercadopago.com/v1/payments',
      ARRAY[
        ('Authorization', 'Bearer ' || current_setting('app.mercadopago_access_token'))::http_header,
        ('Content-Type', 'application/json')::http_header
      ],
      'application/json',
      jsonb_build_object(
        'transaction_amount', offer_data.price,
        'payment_method_id', 'pix',
        'payer', jsonb_build_object(
          'email', customer_email,
          'first_name', split_part(customer_name, ' ', 1),
          'last_name', substr(customer_name, strpos(customer_name, ' ') + 1),
          'identification', jsonb_build_object(
            'type', 'CPF',
            'number', customer_document
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
    mercadopago_response->'point_of_interaction'->'transaction_data'->>'qr_code',
    mercadopago_response->'point_of_interaction'->'transaction_data'->>'qr_code_base64',
    mercadopago_response->'point_of_interaction'->'transaction_data'->>'qr_code',
    (now() + interval '30 minutes')
  );

  -- Return payment details
  RETURN jsonb_build_object(
    'payment_id', payment_id,
    'qr_code', mercadopago_response->'point_of_interaction'->'transaction_data'->>'qr_code',
    'qr_code_base64', mercadopago_response->'point_of_interaction'->'transaction_data'->>'qr_code_base64',
    'copy_paste', mercadopago_response->'point_of_interaction'->'transaction_data'->>'qr_code',
    'expires_at', (now() + interval '30 minutes')
  );
END;
$$;