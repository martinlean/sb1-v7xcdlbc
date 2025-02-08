-- Create withdrawal_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'bank_transfer')),
  payment_details jsonb NOT NULL,
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "withdrawal_requests_select_policy" ON withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_insert_policy" ON withdrawal_requests;

-- Create policies with unique names
CREATE POLICY "withdrawal_requests_select_policy"
ON withdrawal_requests FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM seller_profiles
    WHERE user_id = auth.uid()
    AND admin_access = true
    AND status = 'active'
  )
);

CREATE POLICY "withdrawal_requests_insert_policy"
ON withdrawal_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  p_period text DEFAULT 'week'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_start timestamptz;
  stats jsonb;
BEGIN
  -- Set period start date
  period_start := CASE p_period
    WHEN 'today' THEN date_trunc('day', now())
    WHEN 'week' THEN date_trunc('day', now() - interval '7 days')
    WHEN 'month' THEN date_trunc('day', now() - interval '30 days')
    ELSE '1970-01-01'::timestamptz
  END;

  -- Get stats
  WITH user_stats AS (
    SELECT
      count(*) as total_users,
      count(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as active_users
    FROM auth.users
  ),
  seller_stats AS (
    SELECT
      count(*) as total_sellers,
      count(*) FILTER (WHERE status = 'active') as active_sellers,
      count(*) FILTER (WHERE status = 'pending_verification') as pending_sellers
    FROM seller_profiles
    WHERE admin_access = false
  ),
  transaction_stats AS (
    SELECT
      count(*) as total_transactions,
      count(*) FILTER (WHERE status = 'completed') as completed_transactions,
      count(*) FILTER (WHERE status = 'pending') as pending_transactions,
      count(*) FILTER (WHERE status = 'failed') as failed_transactions,
      sum(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_volume
    FROM payments
    WHERE created_at >= period_start
  ),
  product_stats AS (
    SELECT
      count(*) as total_products,
      count(*) FILTER (WHERE active = true) as active_products,
      count(*) FILTER (WHERE affiliate_enabled = true) as affiliate_products
    FROM products
  ),
  withdrawal_stats AS (
    SELECT
      count(*) FILTER (WHERE status = 'pending') as pending_withdrawals,
      sum(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
    FROM withdrawal_requests
  )
  SELECT 
    jsonb_build_object(
      'users', jsonb_build_object(
        'total', COALESCE((SELECT total_users FROM user_stats), 0),
        'active', COALESCE((SELECT active_users FROM user_stats), 0)
      ),
      'sellers', jsonb_build_object(
        'total', COALESCE((SELECT total_sellers FROM seller_stats), 0),
        'active', COALESCE((SELECT active_sellers FROM seller_stats), 0),
        'pending', COALESCE((SELECT pending_sellers FROM seller_stats), 0)
      ),
      'transactions', jsonb_build_object(
        'total', COALESCE((SELECT total_transactions FROM transaction_stats), 0),
        'completed', COALESCE((SELECT completed_transactions FROM transaction_stats), 0),
        'pending', COALESCE((SELECT pending_transactions FROM transaction_stats), 0),
        'failed', COALESCE((SELECT failed_transactions FROM transaction_stats), 0),
        'volume', COALESCE((SELECT total_volume FROM transaction_stats), 0)
      ),
      'products', jsonb_build_object(
        'total', COALESCE((SELECT total_products FROM product_stats), 0),
        'active', COALESCE((SELECT active_products FROM product_stats), 0),
        'affiliate_enabled', COALESCE((SELECT affiliate_products FROM product_stats), 0)
      ),
      'withdrawals', jsonb_build_object(
        'pending_count', COALESCE((SELECT pending_withdrawals FROM withdrawal_stats), 0),
        'pending_amount', COALESCE((SELECT pending_amount FROM withdrawal_stats), 0)
      )
    ) INTO stats;

  RETURN stats;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON withdrawal_requests TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats TO authenticated;

-- Create new indexes with unique names
CREATE INDEX IF NOT EXISTS withdrawal_requests_user_id_idx ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS withdrawal_requests_status_idx ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS withdrawal_requests_created_at_idx ON withdrawal_requests(created_at);

-- Add helpful comments
COMMENT ON TABLE withdrawal_requests IS 'Withdrawal requests from sellers';
COMMENT ON FUNCTION get_admin_dashboard_stats IS 'Get admin dashboard statistics for a given period';