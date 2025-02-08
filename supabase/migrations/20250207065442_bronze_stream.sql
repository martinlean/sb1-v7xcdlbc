-- Create function to test Stripe webhook
CREATE OR REPLACE FUNCTION test_stripe_webhook(
  payment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_data record;
  webhook_result jsonb;
BEGIN
  -- Get payment data
  SELECT * INTO payment_data
  FROM payments
  WHERE id = payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not found'
    );
  END IF;

  -- Simulate Stripe webhook
  UPDATE payments
  SET 
    status = 'completed',
    updated_at = now()
  WHERE id = payment_id
  RETURNING jsonb_build_object(
    'id', id,
    'status', status,
    'amount', amount,
    'currency', currency,
    'metadata', metadata,
    'tracking_data', tracking_data,
    'utm_source', utm_source,
    'utm_medium', utm_medium,
    'utm_campaign', utm_campaign
  ) INTO webhook_result;

  RETURN jsonb_build_object(
    'success', true,
    'data', webhook_result,
    'webhook_logs', (
      SELECT json_agg(row_to_json(l))
      FROM webhook_logs l
      WHERE l.payload->>'transaction_id' = payment_id::text
      ORDER BY created_at DESC
      LIMIT 1
    )
  );
END;
$$;

-- Create function to test MercadoPago webhook
CREATE OR REPLACE FUNCTION test_mercadopago_webhook(
  payment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_data record;
  webhook_result jsonb;
BEGIN
  -- Get payment data
  SELECT * INTO payment_data
  FROM payments
  WHERE id = payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not found'
    );
  END IF;

  -- Simulate MercadoPago webhook
  UPDATE payments
  SET 
    status = 'completed',
    updated_at = now()
  WHERE id = payment_id
  RETURNING jsonb_build_object(
    'id', id,
    'status', status,
    'amount', amount,
    'currency', currency,
    'metadata', metadata,
    'tracking_data', tracking_data,
    'utm_source', utm_source,
    'utm_medium', utm_medium,
    'utm_campaign', utm_campaign
  ) INTO webhook_result;

  RETURN jsonb_build_object(
    'success', true,
    'data', webhook_result,
    'webhook_logs', (
      SELECT json_agg(row_to_json(l))
      FROM webhook_logs l
      WHERE l.payload->>'transaction_id' = payment_id::text
      ORDER BY created_at DESC
      LIMIT 1
    )
  );
END;
$$;

-- Create function to check webhook logs
CREATE OR REPLACE FUNCTION check_webhook_logs(
  payment_id uuid
)
RETURNS TABLE (
  provider text,
  event text,
  status text,
  error text,
  created_at timestamptz,
  payload jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    provider,
    event,
    status,
    error,
    created_at,
    payload
  FROM webhook_logs
  WHERE payload->>'transaction_id' = payment_id::text
  ORDER BY created_at DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION test_stripe_webhook TO authenticated;
GRANT EXECUTE ON FUNCTION test_mercadopago_webhook TO authenticated;
GRANT EXECUTE ON FUNCTION check_webhook_logs TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION test_stripe_webhook IS 'Test function to simulate Stripe webhook';
COMMENT ON FUNCTION test_mercadopago_webhook IS 'Test function to simulate MercadoPago webhook';
COMMENT ON FUNCTION check_webhook_logs IS 'Function to check webhook logs for a payment';