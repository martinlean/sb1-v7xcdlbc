import { Request, Response } from 'express';
import { LoggingService, LogLevel, LogCategory } from '../services/logging';
import { WebhookService } from '../services/webhooks';

const logger = LoggingService.getInstance();
const webhookService = WebhookService.getInstance();

export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.stripeEvent;
    
    logger.log({
      level: LogLevel.INFO,
      category: LogCategory.WEBHOOK,
      message: 'Received Stripe webhook',
      metadata: {
        event_type: event.type,
        event_id: event.id
      }
    });

    await webhookService.handleStripeWebhook(event);
    res.json({ received: true });
  } catch (err) {
    logger.log({
      level: LogLevel.ERROR,
      category: LogCategory.WEBHOOK,
      message: 'Error handling Stripe webhook',
      metadata: { error: err }
    });
    res.status(400).json({ error: 'Webhook error' });
  }
};

export const handleMercadoPagoWebhook = async (req: Request, res: Response) => {
  try {
    logger.log({
      level: LogLevel.INFO,
      category: LogCategory.WEBHOOK,
      message: 'Received MercadoPago webhook',
      metadata: {
        action: req.body.action,
        data: req.body.data
      }
    });

    await webhookService.handleMercadoPagoWebhook(req.body);
    res.json({ received: true });
  } catch (err) {
    logger.log({
      level: LogLevel.ERROR,
      category: LogCategory.WEBHOOK,
      message: 'Error handling MercadoPago webhook',
      metadata: { error: err }
    });
    res.status(400).json({ error: 'Webhook error' });
  }
};