import { supabase } from '../lib/supabase';

export class UTMifyService {
  private static instance: UTMifyService;

  private constructor() {}

  static getInstance() {
    if (!UTMifyService.instance) {
      UTMifyService.instance = new UTMifyService();
    }
    return UTMifyService.instance;
  }

  async sendPaymentData(payment: any) {
    try {
      // Get seller's UTMify settings
      const { data: settings } = await supabase
        .from('seller_profiles')
        .select('utmify_settings')
        .eq('user_id', payment.user_id)
        .single();

      if (!settings?.utmify_settings?.enabled || !settings.utmify_settings.api_token) {
        return; // UTMify not enabled or no API token
      }

      // Map payment status to UTMify status
      const status = this.mapPaymentStatus(payment.status);
      if (!status) return; // Status not configured for sending

      // Prepare API payload
      const payload = {
        transaction_id: payment.id,
        order_id: payment.metadata?.order_id,
        customer: {
          email: payment.metadata?.customer_email,
          name: payment.metadata?.customer_name,
          phone: payment.metadata?.customer_phone
        },
        product: {
          id: payment.metadata?.product_id,
          name: payment.metadata?.product_name,
          price: payment.amount
        },
        payment: {
          method: payment.payment_method,
          status: status,
          currency: payment.currency,
          amount: payment.amount
        },
        utm: payment.metadata?.utm || {},
        created_at: payment.created_at,
        updated_at: payment.updated_at
      };

      // Send data to UTMify API
      const response = await fetch('https://api.utmify.com/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.utmify_settings.api_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`UTMify API error: ${response.statusText}`);
      }

      // Log successful API call
      await supabase.from('webhook_logs').insert({
        provider: 'utmify',
        event: 'payment_update',
        payload,
        status: 'success',
        seller_id: payment.user_id
      });

    } catch (error) {
      // Log failed API call
      await supabase.from('webhook_logs').insert({
        provider: 'utmify',
        event: 'payment_update',
        payload: payment,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        seller_id: payment.user_id
      });

      console.error('Error sending UTMify data:', error);
    }
  }

  private mapPaymentStatus(status: string): string | null {
    const statusMap: Record<string, string> = {
      'completed': 'paid',
      'pending': 'waiting_payment',
      'failed': 'rejected',
      'refunded': 'refunded',
      'chargeback': 'chargeback',
      'dispute': 'dispute',
      'blocked': 'blocked',
      'pre_chargeback': 'pre_chargeback'
    };

    return statusMap[status] || null;
  }
}