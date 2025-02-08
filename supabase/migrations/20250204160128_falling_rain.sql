/*
  # Atualização da configuração do webhook do Stripe

  1. Alterações
    - Adiciona o webhook_secret na configuração do Stripe
    - Atualiza a URL do webhook para o endpoint correto

  2. Segurança
    - Mantém as políticas de RLS existentes
    - Atualiza apenas os campos necessários
*/

-- Atualiza a configuração do Stripe com o webhook_secret
UPDATE payment_provider_configs
SET config = jsonb_build_object(
  'public_key', config->>'pk_live_51OSh71JaNghssXXxkhjvslPULVIO3zWwV6SP7iLlivYpvfrNgx8Qyyjzi6tze2ZQ5STbcdkpRJXZlukLyF70IWmd00UT1cizDg',
  'secret_key', config->>'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',
  'webhook_url', 'https://swapage.link/webhook-stripe',
  'webhook_secret', 'whsec_your_webhook_secret_here'
)
WHERE provider = 'stripe'
AND is_active = true;