import { loadStripe } from '@stripe/stripe-js';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { supabase } from '../lib/supabase';
import { NotificationService } from './notifications';

export class PaymentService {
  private static instance: PaymentService;
  private stripe: any;
  private mercadopago: any;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  static async getInstance() {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
      await PaymentService.instance.initialize();
    }
    return PaymentService.instance;
  }

  private async initialize() {
    try {
      // Initialize Stripe
      this.stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      
      // Initialize MercadoPago
      await loadMercadoPago();
      this.mercadopago = new window.MercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY);
    } catch (err) {
      console.error('Error initializing payment providers:', err);
      throw new Error('Failed to initialize payment providers');
    }
  }

  async processPayment(data: {
    method: 'card' | 'pix';
    amount: number;
    customer: {
      email: string;
      name: string;
      document?: string;
      phone?: string;
    };
    product: {
      id: string;
      name: string;
    };
    card?: {
      number: string;
      holder: string;
      expMonth: string;
      expYear: string;
      cvv: string;
      installments: number;
    };
  }) {
    try {
      // Create payment record
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          amount: data.amount,
          status: 'pending',
          payment_method: data.method,
          metadata: {
            customer_email: data.customer.email,
            customer_name: data.customer.name,
            customer_document: data.customer.document,
            customer_phone: data.customer.phone,
            product_id: data.product.id,
            product_name: data.product.name
          }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (data.method === 'card') {
        const result = await this.processCardPayment(data, payment.id);
        
        // Send success notification
        await this.notificationService.sendPaymentConfirmation({
          email: data.customer.email,
          name: data.customer.name,
          amount: data.amount,
          productName: data.product.name,
          paymentMethod: 'card',
          accessUrl: `https://app.rewardsmidia.online/products/${data.product.id}/access`
        });

        return result;
      } else {
        const result = await this.processPixPayment(data, payment.id);
        
        // Send PIX instructions
        await this.notificationService.sendPaymentConfirmation({
          email: data.customer.email,
          name: data.customer.name,
          amount: data.amount,
          productName: data.product.name,
          paymentMethod: 'pix'
        });

        return result;
      }
    } catch (err) {
      // Send failure notification
      await this.notificationService.sendPaymentFailure({
        email: data.customer.email,
        name: data.customer.name,
        amount: data.amount,
        productName: data.product.name,
        paymentMethod: data.method,
        error: err instanceof Error ? err.message : 'Unknown error'
      });

      throw err;
    }
  }

  private async processCardPayment(data: any, paymentId: string) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Create payment intent
      const response = await fetch('https://api.rewardsmidia.online/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.amount,
          currency: 'brl',
          payment_method_data: {
            type: 'card',
            card: {
              number: data.card.number,
              exp_month: data.card.expMonth,
              exp_year: data.card.expYear,
              cvc: data.card.cvv
            }
          },
          metadata: {
            payment_id: paymentId,
            customer_email: data.customer.email,
            product_id: data.product.id
          }
        })
      });

      const { client_secret } = await response.json();

      // Confirm payment
      const { error: confirmError } = await this.stripe.confirmCardPayment(client_secret);
      if (confirmError) throw confirmError;

      return { success: true };
    } catch (err) {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);

      throw err;
    }
  }

  private async processPixPayment(data: any, paymentId: string) {
    try {
      if (!this.mercadopago) {
        throw new Error('MercadoPago not initialized');
      }

      // Create PIX payment
      const response = await fetch('https://api.rewardsmidia.online/create-pix-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_amount: data.amount,
          payment_method_id: 'pix',
          payer: {
            email: data.customer.email,
            first_name: data.customer.name.split(' ')[0],
            last_name: data.customer.name.split(' ').slice(1).join(' '),
            identification: {
              type: 'CPF',
              number: data.customer.document?.replace(/\D/g, '')
            }
          },
          metadata: {
            payment_id: paymentId,
            product_id: data.product.id
          }
        })
      });

      const pixData = await response.json();

      // Save PIX data
      await supabase
        .from('pix_payments')
        .insert({
          payment_id: paymentId,
          qr_code: pixData.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: pixData.point_of_interaction.transaction_data.qr_code_base64,
          copy_paste: pixData.point_of_interaction.transaction_data.qr_code,
          expires_at: new Date(Date.now() + 30 * 60 * 1000)
        });

      return {
        success: true,
        pixCopiaECola: pixData.point_of_interaction.transaction_data.qr_code,
        pixQRCode: pixData.point_of_interaction.transaction_data.qr_code_base64,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };
    } catch (err) {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);

      throw err;
    }
  }
}