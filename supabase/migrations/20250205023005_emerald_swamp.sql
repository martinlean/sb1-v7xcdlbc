-- Create PIX payments table
CREATE TABLE IF NOT EXISTS pix_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id),
  qr_code text NOT NULL,
  qr_code_base64 text NOT NULL,
  copy_paste text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pix_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their PIX payments"
ON pix_payments
FOR SELECT
TO authenticated
USING (
  payment_id IN (
    SELECT id FROM payments WHERE user_id = auth.uid()
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_pix_payments_updated_at
  BEFORE UPDATE ON pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index
CREATE INDEX idx_pix_payments_payment ON pix_payments(payment_id);