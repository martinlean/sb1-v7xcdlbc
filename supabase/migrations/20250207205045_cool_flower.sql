-- Drop ALL existing policies
DROP POLICY IF EXISTS "enable_all_if_product_owner" ON offers;
DROP POLICY IF EXISTS "allow_if_product_owner" ON offers;
DROP POLICY IF EXISTS "offers_select_policy" ON offers;
DROP POLICY IF EXISTS "offers_insert_policy" ON offers;
DROP POLICY IF EXISTS "offers_update_policy" ON offers;
DROP POLICY IF EXISTS "offers_delete_policy" ON offers;
DROP POLICY IF EXISTS "enable_offers_all_access" ON offers;
DROP POLICY IF EXISTS "Users can manage their own offers" ON offers;
DROP POLICY IF EXISTS "offers_select_policy_v2" ON offers;
DROP POLICY IF EXISTS "offers_insert_policy_v2" ON offers;
DROP POLICY IF EXISTS "offers_update_policy_v2" ON offers;
DROP POLICY IF EXISTS "offers_delete_policy_v2" ON offers;

-- Temporarily disable RLS
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions
GRANT ALL ON offers TO authenticated;
GRANT ALL ON offers TO anon;

-- Re-enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create single, simple policy
CREATE POLICY "allow_authenticated_all"
ON offers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to log offer operations
CREATE OR REPLACE FUNCTION log_offer_operation()
RETURNS trigger AS $$
BEGIN
  INSERT INTO system_logs (
    level,
    category,
    message,
    metadata,
    user_id
  ) VALUES (
    'info',
    'product',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Offer created'
      WHEN TG_OP = 'UPDATE' THEN 'Offer updated'
      WHEN TG_OP = 'DELETE' THEN 'Offer deleted'
    END,
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'operation', TG_OP,
      'user_id', auth.uid()
    ),
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for logging
DROP TRIGGER IF EXISTS log_offer_operations ON offers;
CREATE TRIGGER log_offer_operations
  AFTER INSERT OR UPDATE OR DELETE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION log_offer_operation();

-- Add helpful comments
COMMENT ON POLICY "allow_authenticated_all" ON offers IS 'Allow all operations for authenticated users';
COMMENT ON FUNCTION log_offer_operation IS 'Log all offer operations for debugging';