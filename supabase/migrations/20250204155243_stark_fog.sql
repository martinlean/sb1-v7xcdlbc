/*
  # Add Stripe configuration

  1. Changes
    - Insert Stripe configuration into payment_provider_configs table
*/

INSERT INTO payment_provider_configs (provider, config)
VALUES (
  'stripe',
  jsonb_build_object(
    'public_key', 'pk_live_51OSh71JaNghssXXxkhjvslPULVIO3zWwV6SP7iLlivYpvfrNgx8Qyyjzi6tze2ZQ5STbcdkpRJXZlukLyF70IWmd00UT1cizDg',
    'secret_key', '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',
    'webhook_url', 'https://swapage.link/webhook-stripe'
  )
);