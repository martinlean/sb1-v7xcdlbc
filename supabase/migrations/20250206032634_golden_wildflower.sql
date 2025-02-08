-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  category text NOT NULL CHECK (category IN ('auth', 'payment', 'product', 'seller', 'admin', 'system')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Only admins can access system logs"
ON system_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM seller_profiles
    WHERE user_id = auth.uid()
    AND admin_access = true
    AND status = 'active'
  )
);

-- Create indexes
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);

-- Create function to add log entry
CREATE OR REPLACE FUNCTION log_system_event(
  p_level text,
  p_category text,
  p_message text,
  p_metadata jsonb DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid(),
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  -- Validate level
  IF p_level NOT IN ('info', 'warn', 'error') THEN
    RAISE EXCEPTION 'Invalid log level';
  END IF;

  -- Validate category
  IF p_category NOT IN ('auth', 'payment', 'product', 'seller', 'admin', 'system') THEN
    RAISE EXCEPTION 'Invalid log category';
  END IF;

  -- Insert log entry
  INSERT INTO system_logs (
    level,
    category,
    message,
    metadata,
    user_id,
    ip_address
  ) VALUES (
    p_level,
    p_category,
    p_message,
    COALESCE(p_metadata, '{}'::jsonb),
    p_user_id,
    p_ip_address
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON system_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_system_event TO authenticated;

-- Add helpful comments
COMMENT ON TABLE system_logs IS 'System-wide logging table for tracking important events';
COMMENT ON COLUMN system_logs.level IS 'Severity level of the log entry';
COMMENT ON COLUMN system_logs.category IS 'Category of the event being logged';
COMMENT ON COLUMN system_logs.message IS 'Human-readable description of the event';
COMMENT ON COLUMN system_logs.metadata IS 'Additional structured data about the event';
COMMENT ON COLUMN system_logs.user_id IS 'User who triggered the event, if applicable';
COMMENT ON COLUMN system_logs.ip_address IS 'IP address where the event originated';