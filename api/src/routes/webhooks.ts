import { Router } from 'express';
import { handleStripeWebhook, handleMercadoPagoWebhook } from '../controllers/webhooks';
import { validateWebhookSignature } from '../middleware/validation';

const router = Router();

// Stripe webhook endpoint
router.post('/stripe',
  validateWebhookSignature('stripe'),
  handleStripeWebhook
);

// MercadoPago webhook endpoint  
router.post('/mercadopago',
  validateWebhookSignature('mercadopago'),
  handleMercadoPagoWebhook
);

export default router;