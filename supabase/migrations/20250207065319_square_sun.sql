-- Create tracking_integrations table
CREATE TABLE IF NOT EXISTS tracking_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  provider text NOT NULL CHECK (provider IN ('utmify', 'nemu')),
  enabled boolean DEFAULT false,
  webhook_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE tracking_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own integrations"
ON tracking_integrations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add tracking fields to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tracking_data jsonb DEFAULT '{}'::jsonb;

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  response jsonb,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  error text,
  seller_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook logs
CREATE POLICY "Users can view their own webhook logs"
ON webhook_logs
FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

-- Create function to send tracking webhook
CREATE OR REPLACE FUNCTION send_tracking_webhook(
  payment_id uuid,
  provider text DEFAULT 'utmify'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_data record;
  integration_config record;
  webhook_response jsonb;
  tracking_payload jsonb;
BEGIN
  -- Get payment data
  SELECT p.*, u.email as customer_email, u.raw_user_meta_data->>'name' as customer_name
  INTO payment_data
  FROM payments p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.id = payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  -- Get integration config
  SELECT *
  INTO integration_config
  FROM tracking_integrations
  WHERE user_id = payment_data.user_id
  AND provider = send_tracking_webhook.provider
  AND enabled = true;

  IF NOT FOUND THEN
    -- Integration not enabled, exit silently
    RETURN;
  END IF;

  -- Prepare tracking payload
  tracking_payload := jsonb_build_object(
    'transaction_id', payment_data.id,
    'order_id', payment_data.metadata->>'order_id',
    'customer', jsonb_build_object(
      'email', payment_data.customer_email,
      'name', payment_data.customer_name
    ),
    'payment', jsonb_build_object(
      'amount', payment_data.amount,
      'currency', payment_data.currency,
      'method', payment_data.payment_method,
      'status', payment_data.status
    ),
    'utm', jsonb_build_object(
      'source', payment_data.utm_source,
      'medium', payment_data.utm_medium,
      'campaign', payment_data.utm_campaign,
      'term', payment_data.utm_term,
      'content', payment_data.utm_content
    ),
    'metadata', payment_data.metadata,
    'created_at', payment_data.created_at,
    'updated_at', payment_data.updated_at
  );

  -- Send webhook
  BEGIN
    SELECT content::jsonb INTO webhook_response
    FROM http((
      'POST',
      integration_config.webhook_url,
      ARRAY[('Content-Type', 'application/json')]::http_header[],
      'application/json',
      tracking_payload::text
    ));

    -- Log success
    INSERT INTO webhook_logs (
      provider,
      event,
      payload,
      response,
      status,
      seller_id
    ) VALUES (
      provider,
      'payment_update',
      tracking_payload,
      webhook_response,
      'success',
      payment_data.user_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO webhook_logs (
      provider,
      event,
      payload,
      status,
      error,
      seller_id
    ) VALUES (
      provider,
      'payment_update',
      tracking_payload,
      'failed',
      SQLERRM,
      payment_data.user_id
    );
  END;
END;
$$;

-- Create trigger to automatically send tracking webhooks
CREATE OR REPLACE FUNCTION trigger_tracking_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for status changes
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM send_tracking_webhook(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS payment_tracking_trigger ON payments;
CREATE TRIGGER payment_tracking_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_tracking_webhook();

-- Add helpful comments
COMMENT ON TABLE tracking_integrations IS 'Stores tracking integration configurations per user';
COMMENT ON TABLE webhook_logs IS 'Logs of webhook calls to tracking providers';
COMMENT ON FUNCTION send_tracking_webhook IS 'Sends payment data to configured tracking provider';
COMMENT ON FUNCTION trigger_tracking_webhook IS 'Triggers webhook sending on payment status changes';