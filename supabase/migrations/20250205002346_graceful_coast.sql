/*
  # Melhorias na tabela de produtos

  1. Novos Campos
    - Campos para área de membros
    - Campos para afiliados
    - Campos para co-produção
    - Campos para upsell/order bump
    - Campos para personalização
    - Campos para integrações

  2. Novas Tabelas
    - Tabela de afiliados
    - Tabela de co-produtores
    - Tabela de integrações
    - Tabela de pixels
*/

-- Adicionar novos campos na tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS membership_type text CHECK (membership_type IN ('none', 'course', 'subscription', 'community'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS membership_platform text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS membership_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS membership_webhook text;

ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_commission numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_cookie_days integer DEFAULT 30;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_enabled boolean DEFAULT false;

ALTER TABLE products ADD COLUMN IF NOT EXISTS coproduction_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS coproduction_split numeric DEFAULT 0;

ALTER TABLE products ADD COLUMN IF NOT EXISTS upsell_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS upsell_product_id uuid REFERENCES products(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_bump_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_bump_product_id uuid REFERENCES products(id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_checkout_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_checkout_theme jsonb DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_checkout_fields jsonb DEFAULT '[]'::jsonb;

ALTER TABLE products ADD COLUMN IF NOT EXISTS tracking_pixels jsonb DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;

-- Criar tabela de afiliados
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Criar tabela de co-produtores
CREATE TABLE IF NOT EXISTS coproducers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  split_percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Criar tabela de pixels
CREATE TABLE IF NOT EXISTS tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  platform text NOT NULL,
  pixel_id text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coproducers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_pixels ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Users can manage their own affiliates"
ON affiliates
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own coproducers"
ON coproducers
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own pixels"
ON tracking_pixels
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Criar triggers para updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coproducers_updated_at
  BEFORE UPDATE ON coproducers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracking_pixels_updated_at
  BEFORE UPDATE ON tracking_pixels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar índices
CREATE INDEX idx_affiliates_user_product ON affiliates(user_id, product_id);
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_coproducers_user_product ON coproducers(user_id, product_id);
CREATE INDEX idx_coproducers_status ON coproducers(status);
CREATE INDEX idx_tracking_pixels_user ON tracking_pixels(user_id);
CREATE INDEX idx_tracking_pixels_platform ON tracking_pixels(platform);

-- Adicionar comentários
COMMENT ON TABLE affiliates IS 'Afiliados dos produtos';
COMMENT ON TABLE coproducers IS 'Co-produtores dos produtos';
COMMENT ON TABLE tracking_pixels IS 'Pixels de rastreamento';