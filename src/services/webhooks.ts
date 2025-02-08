import { supabase } from '../lib/supabase';
import { NotificationService } from './notifications';

export class WebhookService {
  private static instance: WebhookService;
  private notificationService: NotificationService;

  private constructor() {
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
      }
    } catch (err) {
      console.error('Error handling Stripe webhook:', err);
      throw err;
    }
  }

  async handleMercadoPagoWebhook(event: any) {
    try {
      const { action, data } = event;

      switch (action) {
        case 'payment.created':
          await this.handlePendingPayment(data);
          break;
        case 'payment.updated':
          await this.handlePaymentUpdate(data);
          break;
        case 'payment.refunded':
          await this.handleRefund(data);
          break;
      }
    } catch (err) {
      console.error('Error handling MercadoPago webhook:', err);
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

      // Send confirmation email
      if (updatedPayment) {
        await this.notificationService.sendPaymentConfirmation({
          email: updatedPayment.customers.email,
          name: updatedPayment.customers.name,
          amount: updatedPayment.amount,
          productName: updatedPayment.metadata.product_name,
          paymentMethod: updatedPayment.payment_method,
          accessUrl: `https://app.rewardsmidia.online/products/${updatedPayment.metadata.product_id}/access`
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
      }
    } catch (err) {
      console.error('Error handling payment success:', err);
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
          error: payment.last_payment_error?.message || 'Payment failed'
        });
      }
    } catch (err) {
      console.error('Error handling payment failure:', err);
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
        .eq('provider_payment_id', payment.id)
        .select('*, customers(*)')
        .single();

      if (updateError) throw updateError;

      // Deactivate access
      if (updatedPayment) {
        await supabase
          .from('product_access')
          .update({ status: 'inactive' })
          .eq('payment_id', updatedPayment.id);

        // Send refund notification
        await this.notificationService.sendRefundNotification({
          email: updatedPayment.customers.email,
          name: updatedPayment.customers.name,
          amount: updatedPayment.amount,
          productName: updatedPayment.metadata.product_name,
          paymentMethod: updatedPayment.payment_method
        });
      }
    } catch (err) {
      console.error('Error handling refund:', err);
      throw err;
    }
  }

  private async handlePendingPayment(payment: any) {
    try {
      // Update payment status
      await supabase
        .from('payments')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('provider_payment_id', payment.id);
    } catch (err) {
      console.error('Error handling pending payment:', err);
      throw err;
    }
  }

  private async handlePaymentUpdate(payment: any) {
    try {
      const status = payment.status === 'approved' ? 'completed' : 
                     payment.status === 'rejected' ? 'failed' : 'pending';

      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('provider_payment_id', payment.id)
        .select('*, customers(*)')
        .single();

      if (updateError) throw updateError;

      if (updatedPayment) {
        if (status === 'completed') {
          // Send confirmation email
          await this.notificationService.sendPaymentConfirmation({
            email: updatedPayment.customers.email,
            name: updatedPayment.customers.name,
            amount: updatedPayment.amount,
            productName: updatedPayment.metadata.product_name,
            paymentMethod: updatedPayment.payment_method,
            accessUrl: `https://app.rewardsmidia.online/products/${updatedPayment.metadata.product_id}/access`
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
        } else if (status === 'failed') {
          // Send failure notification
          await this.notificationService.sendPaymentFailure({
            email: updatedPayment.customers.email,
            name: updatedPayment.customers.name,
            amount: updatedPayment.amount,
            productName: updatedPayment.metadata.product_name,
            paymentMethod: updatedPayment.payment_method,
            error: payment.status_detail || 'Payment failed'
          });
        }
      }
    } catch (err) {
      console.error('Error handling payment update:', err);
      throw err;
    }
  }
}