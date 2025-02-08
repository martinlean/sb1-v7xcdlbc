-- Drop ALL existing policies
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

-- Temporarily disable RLS to ensure clean state
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create single simple policy for all operations
CREATE POLICY "allow_if_product_owner"
ON offers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = offers.product_id
    AND products.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_id
    AND products.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON offers TO authenticated;

-- Add helpful comment
COMMENT ON POLICY "allow_if_product_owner" ON offers IS 'Allow all operations if user owns the associated product';