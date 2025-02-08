-- Create function to calculate transaction stats
CREATE OR REPLACE FUNCTION get_transaction_stats(
  user_id uuid,
  period text DEFAULT 'all'
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
  period_start := CASE period
    WHEN 'today' THEN date_trunc('day', now())
    WHEN 'week' THEN date_trunc('day', now() - interval '7 days')
    WHEN 'month' THEN date_trunc('day', now() - interval '30 days')
    ELSE '1970-01-01'::timestamptz
  END;

  -- Calculate stats
  WITH transaction_stats AS (
    SELECT
      status,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM payments
    WHERE 
      user_id = get_transaction_stats.user_id
      AND created_at >= period_start
    GROUP BY status
  )
  SELECT jsonb_build_object(
    'paid', jsonb_build_object(
      'count', COALESCE((SELECT count FROM transaction_stats WHERE status = 'completed'), 0),
      'total', COALESCE((SELECT total_amount FROM transaction_stats WHERE status = 'completed'), 0)
    ),
    'pending', jsonb_build_object(
      'count', COALESCE((SELECT count FROM transaction_stats WHERE status = 'pending'), 0),
      'total', COALESCE((SELECT total_amount FROM transaction_stats WHERE status = 'pending'), 0)
    ),
    'failed', jsonb_build_object(
      'count', COALESCE((SELECT count FROM transaction_stats WHERE status = 'failed'), 0),
      'total', COALESCE((SELECT total_amount FROM transaction_stats WHERE status = 'failed'), 0)
    ),
    'chargeback', jsonb_build_object(
      'count', COALESCE((SELECT count FROM transaction_stats WHERE status = 'chargeback'), 0),
      'total', COALESCE((SELECT total_amount FROM transaction_stats WHERE status = 'chargeback'), 0)
    ),
    'refunded', jsonb_build_object(
      'count', COALESCE((SELECT count FROM transaction_stats WHERE status = 'refunded'), 0),
      'total', COALESCE((SELECT total_amount FROM transaction_stats WHERE status = 'refunded'), 0)
    ),
    'total_transactions', (
      SELECT COUNT(*)
      FROM payments 
      WHERE user_id = get_transaction_stats.user_id
      AND created_at >= period_start
    ),
    'total_amount', (
      SELECT COALESCE(SUM(amount), 0)
      FROM payments
      WHERE user_id = get_transaction_stats.user_id 
      AND status = 'completed'
      AND created_at >= period_start
    )
  ) INTO stats;

  RETURN stats;
END;
$$;

-- Create trigger to update stats on payment changes
CREATE OR REPLACE FUNCTION update_transaction_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify clients about stats update
  PERFORM pg_notify(
    'transaction_stats_update',
    json_build_object(
      'user_id', NEW.user_id,
      'status', NEW.status,
      'amount', NEW.amount
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS payment_stats_trigger ON payments;
CREATE TRIGGER payment_stats_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_stats();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_transaction_stats TO authenticated;