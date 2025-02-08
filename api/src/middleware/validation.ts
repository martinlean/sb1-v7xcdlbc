import { Request, Response, NextFunction } from 'express';
import { LoggingService, LogLevel, LogCategory } from '../services/logging';
import Stripe from 'stripe';

const logger = LoggingService.getInstance();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const validateWebhookSignature = (provider: 'stripe' | 'mercadopago') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (provider === 'stripe') {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
          throw new Error('Missing Stripe signature');
        }

        // Verify Stripe signature
        try {
          const event = stripe.webhooks.constructEvent(
            req.rawBody, // Raw request body
            signature,
            'whsec_JRTWXFaEAzvsDqP07ZeGXtAjIUO8CPpW' // Your webhook secret
          );
          req.stripeEvent = event;
        } catch (err) {
          logger.log({
            level: LogLevel.ERROR,
            category: LogCategory.SECURITY,
            message: 'Invalid Stripe signature',
            metadata: { error: err }
          });
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      if (provider === 'mercadopago') {
        // Validate MercadoPago request
        const token = req.headers['x-mp-token'];
        if (!token || token !== process.env.MERCADOPAGO_WEBHOOK_TOKEN) {
          logger.log({
            level: LogLevel.ERROR,
            category: LogCategory.SECURITY,
            message: 'Invalid MercadoPago token',
            metadata: { token }
          });
          return res.status(400).json({ error: 'Invalid token' });
        }
      }

      next();
    } catch (err) {
      logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.SECURITY,
        message: 'Webhook validation failed',
        metadata: { error: err, provider }
      });
      res.status(400).json({ error: 'Webhook validation failed' });
    }
  };
};