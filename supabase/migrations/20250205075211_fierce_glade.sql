-- Drop existing policies
DROP POLICY IF EXISTS "customers_read_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "payments_read_policy" ON payments;
DROP POLICY IF EXISTS "payments_write_policy" ON payments;

-- Temporarily disable RLS
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customers TO anon;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO anon;

-- Create function to handle customer creation
CREATE OR REPLACE FUNCTION handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default values if needed
  NEW.created_at = COALESCE(NEW.created_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new customers
DROP TRIGGER IF EXISTS on_customer_created ON customers;
CREATE TRIGGER on_customer_created
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_customer();

-- Create function to handle payment creation
CREATE OR REPLACE FUNCTION handle_new_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default values
  NEW.created_at = COALESCE(NEW.created_at, now());
  NEW.updated_at = COALESCE(NEW.updated_at, now());
  NEW.status = COALESCE(NEW.status, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new payments
DROP TRIGGER IF EXISTS on_payment_created ON payments;
CREATE TRIGGER on_payment_created
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_payment();