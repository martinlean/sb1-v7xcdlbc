// Serviço de webhooks melhorado
import { supabase } from './supabase';
import { TrackingService } from './tracking';
import { NotificationService } from './notifications';

export class WebhookService {
  private static instance: WebhookService;
  private trackingService: TrackingService;
  private notificationService: NotificationService;

  private constructor() {
    this.trackingService = TrackingService.getInstance();
    this.notificationService = NotificationService.getInstance();
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
      await this.logWebhook('stripe', event);

      const { type, data } = event;

      switch (type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(data.object);
          break;
        case 'charge.refunded':
          await this.handleRefund(data.object);
          break;
        case 'charge.dispute.created':
          await this.handleDispute(data.object);
          break;
        case 'charge.dispute.closed':
          await this.handleDisputeClosed(data.object);
          break;
      }
    } catch (err) {
      console.error('Error handling Stripe webhook:', err);
      await this.logError('stripe_webhook', err);
      throw err;
    }
  }

  async handleMercadoPagoWebhook(event: any) {
    try {
      // Log webhook receipt
      await this.logWebhook('mercadopago', event);

      const { action, data } = event;

      switch (action) {
        case 'payment.created':
          await this.handlePendingPayment(data);
          break;
        case 'payment.updated':
          await this.handlePaymentUpdate(data);
          break;
        case 'payment.refunded':
          await this.handleMPRefund(data);
          break;
        case 'chargebacks.created':
          await this.handleMPDispute(data);
          break;
        case 'chargebacks.resolved':
          await this.handleMPDisputeResolved(data);
          break;
      }
    } catch (err) {
      console.error('Error handling MercadoPago webhook:', err);
      await this.logError('mercadopago_webhook', err);
      throw err;
    }
  }

  private async handlePaymentSuccess(payment: any) {
    try {
      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('provider_payment_id', payment.id)
        .select('*, customers(*)')
        .single();

      if (updateError) throw updateError;

      // Track conversion
      if (updatedPayment) {
        await this.trackingService.trackPayment(
          updatedPayment.id,
          updatedPayment.tracking_data
        );

        // Send confirmation email
        await this.notificationService.sendPaymentConfirmation({
          email: updatedPayment.customers.email,
          name: updatedPayment.customers.name,
          amount: updatedPayment.amount,
          productName: updatedPayment.metadata.product_name,
          paymentMethod: updatedPayment.payment_method
        });

        // Create access record
        await supabase
          .from('product_access')
          .insert({
            user_id: updatedPayment.user_id,
            product_id: updatedPayment.metadata.product_id,
            payment_id: updatedPayment.id,
            status: 'active'
          });

        // Update seller balance
        await this.updateSellerBalance(updatedPayment);
      }
    } catch (err) {
      console.error('Error handling payment success:', err);
      await this.logError('payment_success', err);
      throw err;
    }
  }

  private async handlePaymentFailure(payment: any) {
    try {
      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('provider_payment_id', payment.id)
        .select('*, customers(*)')
        .single();

      if (updateError) throw updateError;

      // Send failure notification
      if (updatedPayment) {
        await this.notificationService.sendPaymentFailure({
          email: updatedPayment.customers.email,
          name: updatedPayment.customers.name,
          amount: updatedPayment.amount,
          productName: updatedPayment.metadata.product_name,
          paymentMethod: updatedPayment.payment_method,
          error: payment.last_payment_error?.message
        });
      }
    } catch (err) {
      console.error('Error handling payment failure:', err);
      await this.logError('payment_failure', err);
      throw err;
    }
  }

  private async handleRefund(payment: any) {
    try {
      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('provider_payment_id', payment.payment_intent)
        .select('*, customers(*)')
        .single();

      if (updateError) throw updateError;

      if (updatedPayment) {
        // Deactivate access
        await supabase
          .from('product_access')
          .update({ status: 'inactive' })
          .eq('payment_id', updatedPayment.id);

        // Send refund notification
        await this.notificationService.sendRefundNotification({
          email: updatedPayment.customers.email,
          name: updatedPayment.customers.name,
          amount: updatedPayment.amount,
          productName: updatedPayment.metadata.product_name
        });

        // Update seller balance
        await this.updateSellerBalance(updatedPayment, true);
      }
    } catch (err) {
      console.error('Error handling refund:', err);
      await this.logError('refund', err);
      throw err;
    }
  }

  private async handleDispute(payment: any) {
    try {
      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'disputed',
          updated_at: new Date().toISOString()
        })
        .eq('provider_payment_id', payment.payment_intent)
        .select('*, customers(*)')
        .single();

      if (updateError) throw updateError;

      if (updatedPayment) {
        // Notify seller
        await this.notificationService.sendDisputeNotification({
          email: updatedPayment.seller_email,
          paymentId: updatedPayment.id,
          amount: updatedPayment.amount,
          reason: payment.dispute?.reason
        });

        // Update seller balance
        await this.updateSellerBalance(updatedPayment, true);
      }
    } catch (err) {
      console.error('Error handling dispute:', err);
      await this.logError('dispute', err);
      throw err;
    }
  }

  private async handleDisputeClosed(payment: any) {
    try {
      const status = payment.dispute?.status === 'won' ? 'completed' : 'refunded';

      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('provider_payment_id', payment.payment_intent)
        .select('*, customers(*)')
        .single();

      if (updateError) throw updateError;

      if (updatedPayment) {
        // Notify seller
        await this.notificationService.sendDisputeClosedNotification({
          email: updatedPayment.seller_email,
          paymentId: updatedPayment.id,
          amount: updatedPayment.amount,
          status: payment.dispute?.status
        });

        // Update seller balance if dispute was won
        if (status === 'completed') {
          await this.updateSellerBalance(updatedPayment);
        }
      }
    } catch (err) {
      console.error('Error handling dispute closed:', err);
      await this.logError('dispute_closed', err);
      throw err;
    }
  }

  private async updateSellerBalance(payment: any, isRefund = false) {
    try {
      const { error: balanceError } = await supabase.rpc(
        'update_seller_balance',
        {
          p_payment_id: payment.id,
          p_is_refund: isRefund
        }
      );

      if (balanceError) throw balanceError;
    } catch (err) {
      console.error('Error updating seller balance:', err);
      await this.logError('balance_update', err);
      throw err;
    }
  }

  private async logWebhook(provider: string, payload: any) {
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          provider,
          event: payload.type || payload.action,
          payload,
          status: 'received'
        });
    } catch (err) {
      console.error('Error logging webhook:', err);
    }
  }

  private async logError(type: string, error: any) {
    try {
      await supabase
        .from('error_logs')
        .insert({
          type,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
    } catch (err) {
      console.error('Error logging error:', err);
    }
  }
}