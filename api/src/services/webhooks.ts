import { supabase } from '../lib/supabase';
import { NotificationService } from './notifications';
import { LoggingService, LogLevel, LogCategory } from './logging';

export class WebhookService {
  private static instance: WebhookService;
  private notificationService: NotificationService;
  private logger: LoggingService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.logger = LoggingService.getInstance();
  }

  static getInstance() {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  async handleStripeWebhook(event: any) {
    try {
      // Log webhook receipt
      this.logger.log({
        level: LogLevel.INFO,
        category: LogCategory.WEBHOOK,
        message: 'Received Stripe webhook',
        metadata: { event_type: event.type }
      });

      switch (event.type) {
        // Account events
        case 'account.updated':
        case 'account.application.authorized':
        case 'account.application.deauthorized':
        case 'account.external_account.created':
        case 'account.external_account.deleted':
        case 'account.external_account.updated':
          await this.handleAccountEvent(event.type, event.data.object);
          break;

        // Payment events  
        case 'payment_intent.succeeded':
        case 'payment_intent.payment_failed':
        case 'payment_intent.canceled':
        case 'payment_intent.processing':
        case 'payment_intent.requires_action':
        case 'payment_intent.amount_capturable_updated':
        case 'payment_intent.partially_funded':
        case 'payment_intent.created':
          await this.handlePaymentIntentEvent(event.type, event.data.object);
          break;

        // Charge events
        case 'charge.captured':
        case 'charge.expired':
        case 'charge.failed':
        case 'charge.pending':
        case 'charge.refunded':
        case 'charge.succeeded':
        case 'charge.updated':
          await this.handleChargeEvent(event.type, event.data.object);
          break;

        // Dispute events  
        case 'charge.dispute.closed':
        case 'charge.dispute.created': 
        case 'charge.dispute.funds_reinstated':
        case 'charge.dispute.funds_withdrawn':
        case 'charge.dispute.updated':
          await this.handleDisputeEvent(event.type, event.data.object);
          break;

        // Refund events
        case 'charge.refund.updated':
        case 'refund.created':
        case 'refund.failed':
        case 'refund.updated':
          await this.handleRefundEvent(event.type, event.data.object);
          break;

        // Customer events
        case 'customer.created':
        case 'customer.deleted':
        case 'customer.updated':
        case 'customer.source.created':
        case 'customer.source.deleted':
        case 'customer.source.expiring':
        case 'customer.source.updated':
          await this.handleCustomerEvent(event.type, event.data.object);
          break;

        // Balance events
        case 'balance.available':
          await this.handleBalanceEvent(event.data.object);
          break;

        // Payout events  
        case 'payout.canceled':
        case 'payout.created':
        case 'payout.failed':
        case 'payout.paid':
        case 'payout.updated':
          await this.handlePayoutEvent(event.type, event.data.object);
          break;

        default:
          this.logger.log({
            level: LogLevel.INFO,
            category: LogCategory.WEBHOOK,
            message: `Unhandled event type: ${event.type}`,
            metadata: { event }
          });
      }

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.WEBHOOK,
        message: 'Error handling Stripe webhook',
        metadata: { error: err, event_type: event.type }
      });
      throw err;
    }
  }

  private async handlePaymentIntentEvent(type: string, paymentIntent: any) {
    try {
      let status = 'pending';
      
      switch (type) {
        case 'payment_intent.succeeded':
          status = 'completed';
          break;
        case 'payment_intent.payment_failed':
          status = 'failed';
          break;
        case 'payment_intent.canceled':
          status = 'canceled';
          break;
        case 'payment_intent.processing':
          status = 'processing';
          break;
      }

      // Update payment status
      const { data: payment, error: updateError } = await supabase
        .from('payments')
        .update({
          status,
          updated_at: new Date().toISOString(),
          metadata: {
            stripe_status: paymentIntent.status,
            last_error: paymentIntent.last_payment_error?.message
          }
        })
        .eq('provider_payment_id', paymentIntent.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Send notifications
      if (payment) {
        if (status === 'completed') {
          await this.notificationService.sendPaymentConfirmation({
            email: payment.metadata.customer_email,
            name: payment.metadata.customer_name,
            amount: payment.amount,
            productName: payment.metadata.product_name
          });
        } else if (status === 'failed') {
          await this.notificationService.sendPaymentFailure({
            email: payment.metadata.customer_email,
            name: payment.metadata.customer_name,
            amount: payment.amount,
            productName: payment.metadata.product_name,
            error: paymentIntent.last_payment_error?.message
          });
        }
      }

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error handling payment intent event',
        metadata: { error: err, type, payment_intent_id: paymentIntent.id }
      });
      throw err;
    }
  }

  private async handleChargeEvent(type: string, charge: any) {
    try {
      let status = charge.status;
      
      // Update payment status
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status,
          updated_at: new Date().toISOString(),
          metadata: {
            stripe_charge_id: charge.id,
            charge_status: charge.status
          }
        })
        .eq('provider_payment_id', charge.payment_intent);

      if (updateError) throw updateError;

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error handling charge event',
        metadata: { error: err, type, charge_id: charge.id }
      });
      throw err;
    }
  }

  private async handleDisputeEvent(type: string, dispute: any) {
    try {
      const status = type === 'charge.dispute.closed' && dispute.status === 'won' 
        ? 'completed'
        : 'disputed';

      // Update payment status
      const { data: payment, error: updateError } = await supabase
        .from('payments')
        .update({
          status,
          updated_at: new Date().toISOString(),
          metadata: {
            dispute_id: dispute.id,
            dispute_status: dispute.status,
            dispute_reason: dispute.reason
          }
        })
        .eq('provider_payment_id', dispute.payment_intent)
        .select()
        .single();

      if (updateError) throw updateError;

      // Send notifications
      if (payment) {
        await this.notificationService.sendDisputeNotification({
          email: payment.metadata.seller_email,
          paymentId: payment.id,
          amount: payment.amount,
          reason: dispute.reason
        });
      }

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error handling dispute event',
        metadata: { error: err, type, dispute_id: dispute.id }
      });
      throw err;
    }
  }

  private async handleRefundEvent(type: string, refund: any) {
    try {
      // Update payment status
      const { data: payment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
          metadata: {
            refund_id: refund.id,
            refund_reason: refund.reason
          }
        })
        .eq('provider_payment_id', refund.payment_intent)
        .select()
        .single();

      if (updateError) throw updateError;

      // Send notifications
      if (payment) {
        await this.notificationService.sendRefundNotification({
          email: payment.metadata.customer_email,
          name: payment.metadata.customer_name,
          amount: payment.amount,
          productName: payment.metadata.product_name
        });
      }

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error handling refund event',
        metadata: { error: err, type, refund_id: refund.id }
      });
      throw err;
    }
  }

  private async handleBalanceEvent(balance: any) {
    try {
      // Log balance update
      this.logger.log({
        level: LogLevel.INFO,
        category: LogCategory.PAYMENT,
        message: 'Balance updated',
        metadata: { balance }
      });

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error handling balance event',
        metadata: { error: err }
      });
      throw err;
    }
  }

  private async handlePayoutEvent(type: string, payout: any) {
    try {
      // Log payout event
      this.logger.log({
        level: LogLevel.INFO,
        category: LogCategory.PAYMENT,
        message: 'Payout event received',
        metadata: { type, payout }
      });

      if (type === 'payout.paid') {
        // Update seller balance
        const { error: balanceError } = await supabase.rpc(
          'update_seller_balance',
          {
            p_payout_id: payout.id,
            p_amount: payout.amount
          }
        );

        if (balanceError) throw balanceError;
      }

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error handling payout event',
        metadata: { error: err, type, payout_id: payout.id }
      });
      throw err;
    }
  }

  private async handleAccountEvent(type: string, account: any) {
    try {
      // Log account event
      this.logger.log({
        level: LogLevel.INFO,
        category: LogCategory.ACCOUNT,
        message: 'Account event received',
        metadata: { type, account }
      });

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.ACCOUNT,
        message: 'Error handling account event',
        metadata: { error: err, type }
      });
      throw err;
    }
  }

  private async handleCustomerEvent(type: string, customer: any) {
    try {
      // Log customer event
      this.logger.log({
        level: LogLevel.INFO,
        category: LogCategory.CUSTOMER,
        message: 'Customer event received',
        metadata: { type, customer }
      });

    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.CUSTOMER,
        message: 'Error handling customer event',
        metadata: { error: err, type }
      });
      throw err;
    }
  }
}