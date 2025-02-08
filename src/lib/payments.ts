// Serviço de pagamentos melhorado
import { supabase } from './supabase';
import { TrackingService } from './tracking';

interface PaymentData {
  amount: number;
  currency: string;
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
  offer: {
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

export class PaymentService {
  private static instance: PaymentService;
  private trackingService: TrackingService;

  private constructor() {
    this.trackingService = TrackingService.getInstance();
  }

  static getInstance() {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createPayment(data: PaymentData) {
    try {
      // Get tracking data
      const trackingData = this.trackingService.getTrackingData();

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          amount: data.amount,
          currency: data.currency.toLowerCase(),
          status: 'pending',
          metadata: {
            ...data.metadata,
            customer_email: data.customer.email,
            customer_name: data.customer.name,
            customer_document: data.customer.document,
            customer_phone: data.customer.phone,
            product_id: data.product.id,
            product_name: data.product.name,
            offer_id: data.offer.id,
            offer_name: data.offer.name
          },
          ...trackingData
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Track payment creation
      await this.trackingService.trackPayment(payment.id, trackingData);

      return payment;
    } catch (err) {
      console.error('Error creating payment:', err);
      throw err;
    }
  }

  async processStripePayment(paymentId: string, paymentMethodId: string) {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          product:product_id (
            payment_settings
          )
        `)
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      // Create Stripe payment intent
      const { data: intentData, error: intentError } = await supabase
        .rpc('create_stripe_payment_intent', {
          p_payment_id: paymentId,
          p_payment_method_id: paymentMethodId
        });

      if (intentError) throw intentError;

      return {
        clientSecret: intentData.client_secret,
        paymentId: payment.id
      };
    } catch (err) {
      console.error('Error processing Stripe payment:', err);
      throw err;
    }
  }

  async processPIXPayment(paymentId: string) {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          product:product_id (
            payment_settings
          )
        `)
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      // Create PIX payment
      const { data: pixData, error: pixError } = await supabase
        .rpc('create_pix_payment_v1', {
          p_payment_id: paymentId
        });

      if (pixError) throw pixError;

      return {
        qrCode: pixData.qr_code,
        qrCodeBase64: pixData.qr_code_base64,
        copyPaste: pixData.copy_paste,
        expiresAt: pixData.expires_at,
        paymentId: payment.id
      };
    } catch (err) {
      console.error('Error processing PIX payment:', err);
      throw err;
    }
  }

  async handleWebhook(provider: 'stripe' | 'mercadopago', event: any) {
    try {
      const { error: webhookError } = await supabase
        .rpc('handle_payment_webhook', {
          p_provider: provider,
          p_event: event
        });

      if (webhookError) throw webhookError;

      return true;
    } catch (err) {
      console.error('Error handling webhook:', err);
      throw err;
    }
  }
}