// Serviço de upsell melhorado
import { supabase } from './supabase';
import { loadStripe } from '@stripe/stripe-js';
import { TrackingService } from './tracking';

export class UpsellService {
  private static instance: UpsellService;
  private trackingService: TrackingService;
  private retryAttempts = 3;
  private retryDelay = 1000;

  private constructor() {
    this.trackingService = TrackingService.getInstance();
  }

  static getInstance() {
    if (!UpsellService.instance) {
      UpsellService.instance = new UpsellService();
    }
    return UpsellService.instance;
  }

  async processUpsell(offerId: string, originalPaymentIntentId: string) {
    try {
      // Validate original payment
      const { data: originalPayment } = await supabase
        .from('payments')
        .select('status')
        .eq('provider_payment_id', originalPaymentIntentId)
        .single();

      if (!originalPayment || originalPayment.status !== 'completed') {
        throw new Error('Original payment must be completed');
      }

      // Get payment method
      const { data: paymentData, error: paymentError } = await this.retryOperation(() =>
        supabase.rpc('get_payment_method', {
          p_payment_intent_id: originalPaymentIntentId
        })
      );

      if (paymentError) throw paymentError;

      // Create upsell payment
      const { data: intentData, error: intentError } = await this.retryOperation(() =>
        supabase.rpc('create_upsell_payment', {
          p_offer_id: offerId,
          p_original_payment_intent_id: originalPaymentIntentId,
          p_payment_method_id: paymentData.payment_method_id
        })
      );

      if (intentError) throw intentError;

      // Load Stripe
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      if (!stripe) throw new Error('Failed to load Stripe');

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.client_secret,
        { payment_method: paymentData.payment_method_id }
      );

      if (confirmError) throw confirmError;

      // Track upsell conversion
      if (paymentIntent) {
        await this.trackingService.trackPayment(
          paymentIntent.id,
          {
            ...this.trackingService.getTrackingData(),
            utm_source: 'upsell',
            utm_medium: 'checkout',
            utm_campaign: `upsell_${offerId}`
          }
        );
      }

      return true;
    } catch (err) {
      console.error('Error processing upsell:', err);
      throw err;
    }
  }

  async processDownsell(offerId: string, originalPaymentIntentId: string) {
    try {
      // Validate original payment
      const { data: originalPayment } = await supabase
        .from('payments')
        .select('status')
        .eq('provider_payment_id', originalPaymentIntentId)
        .single();

      if (!originalPayment || originalPayment.status !== 'completed') {
        throw new Error('Original payment must be completed');
      }

      // Get payment method
      const { data: paymentData, error: paymentError } = await this.retryOperation(() =>
        supabase.rpc('get_payment_method', {
          p_payment_intent_id: originalPaymentIntentId
        })
      );

      if (paymentError) throw paymentError;

      // Create downsell payment
      const { data: intentData, error: intentError } = await this.retryOperation(() =>
        supabase.rpc('create_downsell_payment', {
          p_offer_id: offerId,
          p_original_payment_intent_id: originalPaymentIntentId,
          p_payment_method_id: paymentData.payment_method_id
        })
      );

      if (intentError) throw intentError;

      // Load Stripe
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      if (!stripe) throw new Error('Failed to load Stripe');

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.client_secret,
        { payment_method: paymentData.payment_method_id }
      );

      if (confirmError) throw confirmError;

      // Track downsell conversion
      if (paymentIntent) {
        await this.trackingService.trackPayment(
          paymentIntent.id,
          {
            ...this.trackingService.getTrackingData(),
            utm_source: 'downsell',
            utm_medium: 'checkout',
            utm_campaign: `downsell_${offerId}`
          }
        );
      }

      return true;
    } catch (err) {
      console.error('Error processing downsell:', err);
      throw err;
    }
  }

  private async retryOperation(operation: () => Promise<any>, attempts = this.retryAttempts): Promise<any> {
    try {
      return await operation();
    } catch (err) {
      if (attempts === 1) throw err;
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.retryOperation(operation, attempts - 1);
    }
  }
}