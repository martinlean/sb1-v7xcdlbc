-- Create promotional_links table
CREATE TABLE IF NOT EXISTS promotional_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES offers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  url text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE promotional_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON promotional_links FOR SELECT
TO public
USING (active = true);

CREATE POLICY "Enable insert for authenticated users"
ON promotional_links FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM offers o
    JOIN products p ON p.id = o.product_id
    WHERE o.id = offer_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Enable update for owners"
ON promotional_links FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM offers o
    JOIN products p ON p.id = o.product_id
    WHERE o.id = offer_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM offers o
    JOIN products p ON p.id = o.product_id
    WHERE o.id = offer_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for owners"
ON promotional_links FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM offers o
    JOIN products p ON p.id = o.product_id
    WHERE o.id = offer_id AND p.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_promotional_links_offer ON promotional_links(offer_id);
CREATE INDEX idx_promotional_links_user ON promotional_links(user_id);
CREATE INDEX idx_promotional_links_active ON promotional_links(active);

-- Create updated_at trigger
CREATE TRIGGER update_promotional_links_updated_at
  BEFORE UPDATE ON promotional_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate promotional link
CREATE OR REPLACE FUNCTION generate_promotional_link(
  p_offer_id uuid,
  p_user_id uuid,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_term text DEFAULT NULL,
  p_utm_content text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_url text;
  v_link_id uuid;
BEGIN
  -- Insert promotional link record
  INSERT INTO promotional_links (
    offer_id,
    user_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
  ) VALUES (
    p_offer_id,
    p_user_id,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_utm_term,
    p_utm_content
  ) RETURNING id INTO v_link_id;

  -- Generate URL
  v_base_url := 'https://checkout.rewardsmidia.online/';
  
  RETURN v_base_url || v_link_id::text || 
    CASE 
      WHEN p_utm_source IS NOT NULL THEN '?utm_source=' || p_utm_source
      ELSE ''
    END ||
    CASE 
      WHEN p_utm_medium IS NOT NULL THEN '&utm_medium=' || p_utm_medium
      ELSE ''
    END ||
    CASE 
      WHEN p_utm_campaign IS NOT NULL THEN '&utm_campaign=' || p_utm_campaign
      ELSE ''
    END ||
    CASE 
      WHEN p_utm_term IS NOT NULL THEN '&utm_term=' || p_utm_term
      ELSE ''
    END ||
    CASE 
      WHEN p_utm_content IS NOT NULL THEN '&utm_content=' || p_utm_content
      ELSE ''
    END;
END;
$$;