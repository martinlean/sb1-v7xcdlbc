-- Drop existing RLS policies
DROP POLICY IF EXISTS "offers_select_policy" ON offers;
DROP POLICY IF EXISTS "offers_insert_policy" ON offers;
DROP POLICY IF EXISTS "offers_update_policy" ON offers;
DROP POLICY IF EXISTS "offers_delete_policy" ON offers;
DROP POLICY IF EXISTS "enable_offers_all_access" ON offers;
DROP POLICY IF EXISTS "Users can manage their own offers" ON offers;

-- Ensure RLS is enabled
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create separate policies with unique names
CREATE POLICY "offers_select_policy_v2"
ON offers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = offers.product_id
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "offers_insert_policy_v2"
ON offers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_id
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "offers_update_policy_v2"
ON offers FOR UPDATE
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

CREATE POLICY "offers_delete_policy_v2"
ON offers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = offers.product_id
    AND products.user_id = auth.uid()
  )
);

-- Add helpful comments
COMMENT ON POLICY "offers_select_policy_v2" ON offers IS 'Allow users to view offers for their own products';
COMMENT ON POLICY "offers_insert_policy_v2" ON offers IS 'Allow users to create offers for their own products';
COMMENT ON POLICY "offers_update_policy_v2" ON offers IS 'Allow users to update offers for their own products';
COMMENT ON POLICY "offers_delete_policy_v2" ON offers IS 'Allow users to delete offers for their own products';