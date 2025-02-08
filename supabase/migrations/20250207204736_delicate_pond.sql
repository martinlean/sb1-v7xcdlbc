-- Drop ALL existing policies
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

-- Create debug function
CREATE OR REPLACE FUNCTION debug_offers_access(
  p_product_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  has_access boolean,
  reason text,
  product_exists boolean,
  is_product_owner boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN false
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND user_id = p_user_id) THEN false
      ELSE true
    END as has_access,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN 'Product does not exist'
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND user_id = p_user_id) THEN 'User is not product owner'
      ELSE 'Access granted'
    END as reason,
    EXISTS (SELECT 1 FROM products WHERE id = p_product_id) as product_exists,
    EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND user_id = p_user_id) as is_product_owner;
END;
$$;

-- Re-enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create simplified policy
CREATE POLICY "enable_all_if_product_owner"
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

-- Ensure proper grants
GRANT ALL ON offers TO authenticated;
GRANT EXECUTE ON FUNCTION debug_offers_access TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "enable_all_if_product_owner" ON offers IS 'Enable all operations if user owns the product';
COMMENT ON FUNCTION debug_offers_access IS 'Debug function to check offer access permissions';