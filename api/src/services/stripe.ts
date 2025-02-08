import Stripe from 'stripe';
import { LoggingService, LogLevel, LogCategory } from './logging';

export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe;
  private logger: LoggingService;

  private constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
    this.logger = LoggingService.getInstance();
  }

  static getInstance() {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    customer: {
      email: string;
      name: string;
    };
  }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        payment_method_types: ['card'],
        receipt_email: data.customer.email,
        metadata: {
          customer_name: data.customer.name
        }
      });

      this.logger.log({
        level: LogLevel.INFO,
        category: LogCategory.PAYMENT,
        message: 'Payment intent created successfully',
        metadata: {
          payment_intent_id: paymentIntent.id,
          amount: data.amount,
          currency: data.currency
        }
      });

      return {
        clientSecret: paymentIntent.client_secret
      };
    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error creating payment intent',
        metadata: { error: err }
      });
      throw err;
    }
  }
}