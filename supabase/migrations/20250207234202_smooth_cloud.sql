-- Drop existing policies
DROP POLICY IF EXISTS "enable_offers_access" ON offers;
DROP POLICY IF EXISTS "allow_all_authenticated" ON offers;

-- Ensure RLS is enabled
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create new policy for all operations
CREATE POLICY "enable_all_operations"
ON offers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_offers_product_id ON offers(product_id);

-- Create function to get offers
CREATE OR REPLACE FUNCTION get_product_offers(p_product_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  internal_name text,
  price numeric,
  currency text,
  language text,
  billing_type text,
  active boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    name,
    internal_name,
    price,
    currency,
    language,
    billing_type,
    active,
    created_at
  FROM offers
  WHERE product_id = p_product_id
  ORDER BY created_at DESC;
$$;

-- Grant permissions
GRANT ALL ON offers TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_offers TO authenticated;