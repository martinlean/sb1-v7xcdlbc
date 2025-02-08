/*
  # Payment Providers Setup

  1. New Tables
    - `payment_provider_configs`
      - `id` (uuid, primary key)
      - `provider` (text) - Nome do provedor (stripe/mercadopago)
      - `is_active` (boolean) - Se o provedor está ativo
      - `config` (jsonb) - Configurações específicas do provedor
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payment_provider_configs` table
    - Add policy for authenticated users to read configs
*/

CREATE TABLE IF NOT EXISTS payment_provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_provider_configs ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados podem ler as configurações
CREATE POLICY "Authenticated users can read payment provider configs"
  ON payment_provider_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_provider_configs_updated_at
  BEFORE UPDATE ON payment_provider_configs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();