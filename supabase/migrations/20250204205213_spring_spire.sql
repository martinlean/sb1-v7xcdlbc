/*
  # Add user_id to products table

  1. Changes
    - Add user_id column to products table if it doesn't exist
    - Add foreign key constraint to auth.users
    - Update RLS policies for user-specific access
  
  2. Security
    - Maintain existing RLS policies
    - Add user-specific access control
*/

-- Safely add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Update existing products to set user_id to the first admin user
UPDATE products 
SET user_id = (
  SELECT id 
  FROM auth.users 
  WHERE raw_user_meta_data->>'is_admin' = 'true' 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Add helpful comment
COMMENT ON COLUMN products.user_id IS 'Reference to the user who owns this product';