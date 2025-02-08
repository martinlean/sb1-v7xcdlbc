-- Drop existing RLS policies for offers
DROP POLICY IF EXISTS "Users can manage their own offers" ON offers;

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create new RLS policy for offers
CREATE POLICY "enable_offers_all_access"
ON offers
FOR ALL 
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  product_id IN (
    SELECT id FROM products 
    WHERE user_id = auth.uid()
  )
);

-- Add helpful comments
COMMENT ON POLICY "enable_offers_all_access" ON offers IS 'Allow users to manage offers for their own products';