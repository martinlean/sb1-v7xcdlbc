-- Create tracking_data table
CREATE TABLE IF NOT EXISTS tracking_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  user_agent text,
  ip_address text,
  language text,
  country_code text,
  device_type text,
  created_at timestamptz DEFAULT now()
);

-- Create function to track payment
CREATE OR REPLACE FUNCTION track_payment(
  p_payment_id uuid,
  p_tracking_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert tracking data
  INSERT INTO tracking_data (
    payment_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    referrer,
    user_agent,
    ip_address,
    language,
    country_code,
    device_type
  ) VALUES (
    p_payment_id,
    p_tracking_data->>'utm_source',
    p_tracking_data->>'utm_medium',
    p_tracking_data->>'utm_campaign',
    p_tracking_data->>'utm_term',
    p_tracking_data->>'utm_content',
    p_tracking_data->>'referrer',
    p_tracking_data->>'user_agent',
    p_tracking_data->>'ip_address',
    p_tracking_data->>'language',
    p_tracking_data->>'country_code',
    p_tracking_data->>'device_type'
  );

  -- Update payment with UTM data
  UPDATE payments SET
    utm_source = p_tracking_data->>'utm_source',
    utm_medium = p_tracking_data->>'utm_medium',
    utm_campaign = p_tracking_data->>'utm_campaign',
    utm_term = p_tracking_data->>'utm_term',
    utm_content = p_tracking_data->>'utm_content',
    tracking_data = p_tracking_data
  WHERE id = p_payment_id;

  -- Send to UTMify if enabled
  PERFORM send_to_utmify(p_payment_id);
END;
$$;

-- Create function to send data to UTMify
CREATE OR REPLACE FUNCTION send_to_utmify(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment record;
  v_tracking record;
  v_seller_profile record;
  v_utmify_response jsonb;
BEGIN
  -- Get payment data
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id;

  -- Get tracking data
  SELECT * INTO v_tracking
  FROM tracking_data
  WHERE payment_id = p_payment_id;

  -- Get seller profile with UTMify settings
  SELECT * INTO v_seller_profile
  FROM seller_profiles
  WHERE user_id = v_payment.user_id;

  -- Only proceed if UTMify is enabled
  IF v_seller_profile.utmify_settings->>'enabled' = 'true' THEN
    -- Send data to UTMify
    SELECT content::jsonb INTO v_utmify_response
    FROM http((
      'POST',
      v_seller_profile.utmify_settings->>'webhook_url',
      ARRAY[
        ('Authorization', 'Bearer ' || v_seller_profile.utmify_settings->>'api_token'),
        ('Content-Type', 'application/json')
      ]::http_header[],
      'application/json',
      jsonb_build_object(
        'transaction_id', v_payment.id,
        'amount', v_payment.amount,
        'currency', v_payment.currency,
        'status', v_payment.status,
        'payment_method', v_payment.payment_method,
        'utm_data', jsonb_build_object(
          'source', v_tracking.utm_source,
          'medium', v_tracking.utm_medium,
          'campaign', v_tracking.utm_campaign,
          'term', v_tracking.utm_term,
          'content', v_tracking.utm_content
        ),
        'customer_data', jsonb_build_object(
          'email', v_payment.metadata->>'customer_email',
          'name', v_payment.metadata->>'customer_name'
        ),
        'device_data', jsonb_build_object(
          'user_agent', v_tracking.user_agent,
          'ip_address', v_tracking.ip_address,
          'language', v_tracking.language,
          'country_code', v_tracking.country_code,
          'device_type', v_tracking.device_type
        ),
        'created_at', v_payment.created_at
      )::text
    ));

    -- Log webhook call
    INSERT INTO webhook_logs (
      provider,
      event,
      payload,
      response,
      status,
      seller_id
    ) VALUES (
      'utmify',
      'payment_tracked',
      jsonb_build_object(
        'payment_id', v_payment.id,
        'tracking_data', v_tracking
      ),
      v_utmify_response,
      CASE WHEN v_utmify_response->>'error' IS NULL THEN 'success' ELSE 'failed' END,
      v_payment.user_id
    );
  END IF;
END;
$$;

-- Create function to get payment method
CREATE OR REPLACE FUNCTION get_payment_method(p_payment_intent_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment record;
  v_stripe_response jsonb;
BEGIN
  -- Get payment record
  SELECT * INTO v_payment
  FROM payments
  WHERE provider_payment_id = p_payment_intent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  -- Get payment method from Stripe
  SELECT content::jsonb INTO v_stripe_response
  FROM http((
    'GET',
    'https://api.stripe.com/v1/payment_intents/' || p_payment_intent_id,
    ARRAY[
      ('Authorization', 'Bearer ' || current_setting('app.stripe_secret_key')),
      ('Content-Type', 'application/json')
    ]::http_header[],
    'application/json',
    ''
  ));

  -- Return payment method ID
  RETURN jsonb_build_object(
    'payment_method_id', v_stripe_response->>'payment_method'
  );
END;
$$;

-- Grant necessary permissions
GRANT ALL ON tracking_data TO authenticated;
GRANT EXECUTE ON FUNCTION track_payment TO authenticated;
GRANT EXECUTE ON FUNCTION send_to_utmify TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_method TO authenticated;

-- Add helpful comments
COMMENT ON TABLE tracking_data IS 'Stores tracking and UTM data for payments';
COMMENT ON FUNCTION track_payment IS 'Track payment with UTM and device data';
COMMENT ON FUNCTION send_to_utmify IS 'Send tracking data to UTMify if enabled';
COMMENT ON FUNCTION get_payment_method IS 'Get Stripe payment method for upsells';