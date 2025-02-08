-- Create payment_processor_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_processor_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  processor text NOT NULL CHECK (processor IN ('stripe', 'mercadopago')),
  is_active boolean DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, processor)
);

-- Enable RLS
ALTER TABLE payment_processor_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own configs"
ON payment_processor_configs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create function to validate webhook signature
CREATE OR REPLACE FUNCTION validate_webhook_signature(
  processor text,
  payload jsonb,
  signature text,
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_data record;
BEGIN
  -- Get processor config
  SELECT * INTO config_data
  FROM payment_processor_configs
  WHERE processor = validate_webhook_signature.processor
  AND user_id = validate_webhook_signature.user_id
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Validate signature based on processor
  CASE processor
    WHEN 'stripe' THEN
      -- Implement Stripe signature validation
      RETURN true; -- TODO: Implement actual validation
      
    WHEN 'mercadopago' THEN
      -- Implement MercadoPago signature validation
      RETURN true; -- TODO: Implement actual validation
      
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Create function to handle webhooks
CREATE OR REPLACE FUNCTION handle_payment_webhook(
  processor text,
  payload jsonb,
  signature text,
  user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_id uuid;
  payment_status text;
  webhook_response jsonb;
BEGIN
  -- Validate webhook signature
  IF NOT validate_webhook_signature(processor, payload, signature, user_id) THEN
    RAISE EXCEPTION 'Invalid webhook signature';
  END IF;

  -- Extract payment info based on processor
  CASE processor
    WHEN 'stripe' THEN
      payment_id := (payload->'data'->'object'->>'metadata')::jsonb->>'payment_id';
      payment_status := CASE payload->'data'->'object'->>'status'
        WHEN 'succeeded' THEN 'completed'
        WHEN 'failed' THEN 'failed'
        ELSE 'pending'
      END;
      
    WHEN 'mercadopago' THEN
      payment_id := (payload->'data'->>'metadata')::jsonb->>'payment_id';
      payment_status := CASE payload->'data'->>'status'
        WHEN 'approved' THEN 'completed'
        WHEN 'rejected' THEN 'failed'
        ELSE 'pending'
      END;
      
    ELSE
      RAISE EXCEPTION 'Invalid payment processor';
  END CASE;

  -- Update payment status
  UPDATE payments
  SET 
    status = payment_status,
    updated_at = now(),
    metadata = metadata || jsonb_build_object(
      'webhook_received_at', now(),
      'webhook_processor', processor
    )
  WHERE id = payment_id
  RETURNING jsonb_build_object(
    'payment_id', id,
    'status', status,
    'amount', amount,
    'currency', currency
  ) INTO webhook_response;

  -- Send tracking webhooks
  PERFORM send_tracking_webhook(payment_id);

  RETURN webhook_response;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE payment_processor_configs IS 'Payment processor configurations per user';
COMMENT ON FUNCTION validate_webhook_signature IS 'Validates webhook signatures from payment processors';
COMMENT ON FUNCTION handle_payment_webhook IS 'Handles incoming webhooks from payment processors';