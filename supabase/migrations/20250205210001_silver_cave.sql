-- Add payment_processor column to payments table if it doesn't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_processor text 
CHECK (payment_processor IN ('stripe', 'mercadopago'));

-- Add payment_type column to payments table if it doesn't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type text 
CHECK (payment_type IN ('credit_card', 'pix'));

-- Add payment_status column to payments table if it doesn't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_status text 
CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'refunded'));

-- Add expires_at column to payments table if it doesn't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Create function to handle PIX payment expiration
CREATE OR REPLACE FUNCTION handle_pix_expiration()
RETURNS trigger AS $$
BEGIN
  -- Set expiration time based on product settings or default to 30 minutes
  NEW.expires_at := COALESCE(
    NEW.expires_at,
    now() + (
      COALESCE(
        (NEW.metadata->>'expiration_minutes')::int * interval '1 minute',
        30 * interval '1 minute'
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for PIX payment expiration
DROP TRIGGER IF EXISTS set_pix_expiration ON payments;
CREATE TRIGGER set_pix_expiration
  BEFORE INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.payment_type = 'pix')
  EXECUTE FUNCTION handle_pix_expiration();

-- Add helpful comments
COMMENT ON COLUMN payments.payment_processor IS 'Payment processor used (stripe or mercadopago)';
COMMENT ON COLUMN payments.payment_type IS 'Type of payment (credit_card or pix)';
COMMENT ON COLUMN payments.payment_status IS 'Current status of the payment';
COMMENT ON COLUMN payments.expires_at IS 'Expiration time for PIX payments';