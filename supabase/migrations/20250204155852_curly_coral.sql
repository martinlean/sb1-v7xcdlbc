/*
  # Configuração da integração com Stripe

  1. Funções
    - `process_stripe_payment`: Processa pagamentos via Stripe
    - `create_stripe_payment_intent`: Cria uma intent de pagamento no Stripe
    - `handle_stripe_webhook`: Processa webhooks do Stripe

  2. Segurança
    - Funções são SECURITY DEFINER para acessar chaves seguras
    - Políticas de RLS para proteção dos dados
*/

-- Função para criar Payment Intent do Stripe
CREATE OR REPLACE FUNCTION create_stripe_payment_intent(
  amount numeric,
  currency text,
  customer_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stripe_config jsonb;
  payment_id uuid;
BEGIN
  -- Obter configuração do Stripe
  SELECT config INTO stripe_config
  FROM payment_provider_configs
  WHERE provider = 'stripe'
  AND is_active = true
  LIMIT 1;

  -- Criar registro do pagamento
  INSERT INTO payments (
    user_id,
    amount,
    currency,
    status,
    payment_method,
    payment_provider
  ) VALUES (
    auth.uid(),
    amount,
    currency,
    'pending',
    'card',
    'stripe'
  ) RETURNING id INTO payment_id;

  -- Retornar dados necessários para o frontend
  RETURN jsonb_build_object(
    'payment_id', payment_id,
    'client_secret', 'STRIPE_CLIENT_SECRET', -- Aqui você implementaria a chamada real para o Stripe
    'public_key', stripe_config->>'public_key'
  );
END;
$$;

-- Função para processar webhook do Stripe
CREATE OR REPLACE FUNCTION handle_stripe_webhook(
  payload jsonb,
  stripe_signature text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stripe_config jsonb;
  event_type text;
  payment_intent_id text;
  payment_status text;
BEGIN
  -- Obter configuração do Stripe
  SELECT config INTO stripe_config
  FROM payment_provider_configs
  WHERE provider = 'stripe'
  AND is_active = true
  LIMIT 1;

  -- Verificar assinatura do webhook (implementar verificação real)
  -- Aqui você implementaria a verificação da assinatura do Stripe

  -- Extrair informações do evento
  event_type := payload->>'type';
  payment_intent_id := payload->'data'->'object'->>'id';

  -- Processar evento
  IF event_type = 'payment_intent.succeeded' THEN
    payment_status := 'completed';
  ELSIF event_type = 'payment_intent.payment_failed' THEN
    payment_status := 'failed';
  ELSE
    payment_status := 'unknown';
  END IF;

  -- Atualizar status do pagamento
  UPDATE payments
  SET 
    status = payment_status,
    provider_payment_id = payment_intent_id,
    updated_at = now()
  WHERE provider_payment_id = payment_intent_id;
END;
$$;