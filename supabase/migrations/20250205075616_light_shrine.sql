-- Add upsell columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS upsell_offers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS downsell_offers jsonb DEFAULT '[]'::jsonb;

-- Create upsell_offers table
CREATE TABLE IF NOT EXISTS upsell_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  original_price numeric NOT NULL CHECK (original_price >= 0),
  image text,
  active boolean DEFAULT true,
  type text NOT NULL CHECK (type IN ('upsell', 'downsell')),
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS temporarily
ALTER TABLE upsell_offers DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON upsell_offers TO authenticated, anon;

-- Create function to handle upsell offer creation
CREATE OR REPLACE FUNCTION create_upsell_offer(
  p_product_id uuid,
  p_title text,
  p_description text,
  p_price numeric,
  p_original_price numeric,
  p_image text,
  p_type text DEFAULT 'upsell'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer_id uuid;
BEGIN
  -- Insert offer
  INSERT INTO upsell_offers (
    product_id,
    title,
    description,
    price,
    original_price,
    image,
    type
  ) VALUES (
    p_product_id,
    p_title,
    p_description,
    p_price,
    p_original_price,
    p_image,
    p_type
  ) RETURNING id INTO v_offer_id;

  RETURN v_offer_id;
END;
$$;

-- Create function to update upsell offer
CREATE OR REPLACE FUNCTION update_upsell_offer(
  p_offer_id uuid,
  p_title text,
  p_description text,
  p_price numeric,
  p_original_price numeric,
  p_image text,
  p_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE upsell_offers
  SET
    title = p_title,
    description = p_description,
    price = p_price,
    original_price = p_original_price,
    image = p_image,
    active = p_active,
    updated_at = now()
  WHERE id = p_offer_id;

  RETURN FOUND;
END;
$$;