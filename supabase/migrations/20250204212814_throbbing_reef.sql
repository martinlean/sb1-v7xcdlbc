-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their customers" ON customers;
DROP POLICY IF EXISTS "Public can read customer data" ON customers;

-- Create new policies
CREATE POLICY "Users can view customers with transactions"
ON customers
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT DISTINCT p.customer_id 
    FROM payments p 
    WHERE p.user_id = auth.uid()
  )
);

-- Add helpful comment
COMMENT ON POLICY "Users can view customers with transactions" ON customers IS 
'Users can only view customers who have made transactions with them';