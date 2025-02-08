import { Router } from 'express';
import { createPaymentIntent, processPixPayment } from '../../controllers/payments';
import { validatePaymentRequest } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/create-payment-intent', 
  authenticate,
  validatePaymentRequest,
  createPaymentIntent
);

router.post('/create-pix-payment',
  authenticate,
  validatePaymentRequest,
  processPixPayment
);

export default router;