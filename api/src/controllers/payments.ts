import { Request, Response } from 'express';
import { LoggingService, LogLevel, LogCategory } from '../services/logging';
import { StripeService } from '../services/stripe';
import { MercadoPagoService } from '../services/mercadopago';

const logger = LoggingService.getInstance();
const stripe = StripeService.getInstance();
const mercadopago = MercadoPagoService.getInstance();

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency, customer } = req.body;

    logger.log({
      level: LogLevel.INFO,
      category: LogCategory.PAYMENT,
      message: 'Creating payment intent',
      metadata: { amount, currency, customer }
    });

    const paymentIntent = await stripe.createPaymentIntent({
      amount,
      currency,
      customer
    });

    res.json(paymentIntent);
  } catch (err) {
    logger.log({
      level: LogLevel.ERROR,
      category: LogCategory.PAYMENT,
      message: 'Error creating payment intent',
      metadata: { error: err }
    });

    res.status(400).json({
      error: err instanceof Error ? err.message : 'Error creating payment intent'
    });
  }
};

export const processPixPayment = async (req: Request, res: Response) => {
  try {
    const { amount, customer } = req.body;

    logger.log({
      level: LogLevel.INFO,
      category: LogCategory.PAYMENT,
      message: 'Creating PIX payment',
      metadata: { amount, customer }
    });

    const pixPayment = await mercadopago.createPixPayment({
      amount,
      customer
    });

    res.json(pixPayment);
  } catch (err) {
    logger.log({
      level: LogLevel.ERROR,
      category: LogCategory.PAYMENT,
      message: 'Error creating PIX payment',
      metadata: { error: err }
    });

    res.status(400).json({
      error: err instanceof Error ? err.message : 'Error creating PIX payment'
    });
  }
};