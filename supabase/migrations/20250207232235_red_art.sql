-- Disable RLS temporarily
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;

-- Create new simplified policy
CREATE POLICY "allow_all_authenticated"
ON offers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Add debug logging for offer creation
CREATE OR REPLACE FUNCTION log_offer_creation()
RETURNS trigger AS $$
BEGIN
  INSERT INTO system_logs (
    level,
    category,
    message,
    metadata
  ) VALUES (
    'info',
    'product',
    'Offer creation attempt',
    jsonb_build_object(
      'offer_data', row_to_json(NEW),
      'user_id', auth.uid(),
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for logging offer creation
DROP TRIGGER IF EXISTS log_offer_creation_trigger ON offers;
CREATE TRIGGER log_offer_creation_trigger
  BEFORE INSERT ON offers
  FOR EACH ROW
  EXECUTE FUNCTION log_offer_creation();