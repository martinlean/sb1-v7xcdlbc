// Serviço de rastreamento melhorado
import { supabase } from './supabase';

export interface TrackingData {
  utm_source?: string;
  utm_medium?: string; 
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  language?: string;
  country_code?: string;
  device_type?: string;
  user_agent?: string;
  ip_address?: string;
  session_id?: string;
  page_url?: string;
  timestamp?: string;
}

export class TrackingService {
  private static instance: TrackingService;
  private sessionId: string;
  private retryAttempts = 3;
  private retryDelay = 1000;

  private constructor() {
    this.sessionId = crypto.randomUUID();
  }

  static getInstance() {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }

  async trackPageView() {
    try {
      const data = this.getTrackingData();
      await this.retryOperation(() => 
        supabase.from('page_views').insert({
          ...data,
          session_id: this.sessionId,
          page_url: window.location.href
        })
      );
    } catch (err) {
      console.error('Error tracking page view:', err);
      this.logError('page_view_tracking', err);
    }
  }

  async trackPayment(paymentId: string, data: TrackingData) {
    try {
      // Validate tracking data
      this.validateTrackingData(data);

      // Track payment with retry
      const { error: trackError } = await this.retryOperation(() =>
        supabase.rpc('track_payment', {
          p_payment_id: paymentId,
          p_tracking_data: {
            ...data,
            session_id: this.sessionId,
            user_agent: navigator.userAgent,
            language: navigator.language,
            referrer: document.referrer,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
          }
        })
      );

      if (trackError) throw trackError;

      // Check UTMify settings
      const { data: profile } = await supabase
        .from('seller_profiles')
        .select('utmify_settings')
        .single();

      if (profile?.utmify_settings?.enabled) {
        await this.sendToUTMify(paymentId, data, profile.utmify_settings);
      }

    } catch (err) {
      console.error('Error tracking payment:', err);
      this.logError('payment_tracking', err);
      throw err;
    }
  }

  private validateTrackingData(data: TrackingData) {
    // Validate UTM parameters
    if (data.utm_source && !/^[a-zA-Z0-9_-]+$/.test(data.utm_source)) {
      throw new Error('Invalid UTM source format');
    }
    if (data.utm_medium && !/^[a-zA-Z0-9_-]+$/.test(data.utm_medium)) {
      throw new Error('Invalid UTM medium format');
    }
    if (data.utm_campaign && !/^[a-zA-Z0-9_-]+$/.test(data.utm_campaign)) {
      throw new Error('Invalid UTM campaign format');
    }

    // Validate country code
    if (data.country_code && !/^[A-Z]{2}$/.test(data.country_code)) {
      throw new Error('Invalid country code format');
    }

    // Validate language
    if (data.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(data.language)) {
      throw new Error('Invalid language format');
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

  private async sendToUTMify(paymentId: string, data: TrackingData, settings: any) {
    try {
      const { data: payment } = await supabase
        .from('payments')
        .select(`
          *,
          customer:customer_id (
            email,
            name,
            phone
          ),
          product:product_id (
            name,
            price
          )
        `)
        .eq('id', paymentId)
        .single();

      if (!payment) return;

      const payload = {
        transaction_id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        payment_method: payment.payment_method,
        customer: {
          email: payment.customer.email,
          name: payment.customer.name,
          phone: payment.customer.phone
        },
        product: {
          name: payment.product.name,
          price: payment.product.price
        },
        utm: {
          source: data.utm_source,
          medium: data.utm_medium,
          campaign: data.utm_campaign,
          term: data.utm_term,
          content: data.utm_content
        },
        metadata: {
          session_id: this.sessionId,
          referrer: data.referrer,
          language: data.language,
          country_code: data.country_code,
          device_type: data.device_type,
          user_agent: data.user_agent,
          page_url: window.location.href
        },
        created_at: payment.created_at
      };

      // Send to UTMify with retry
      const response = await this.retryOperation(() =>
        fetch(settings.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.api_token}`
          },
          body: JSON.stringify(payload)
        })
      );

      if (!response.ok) {
        throw new Error(`UTMify API error: ${response.statusText}`);
      }

      // Log success
      await this.logWebhook('utmify', 'success', payload);

    } catch (err) {
      console.error('Error sending to UTMify:', err);
      await this.logWebhook('utmify', 'failed', data, err);
      throw err;
    }
  }

  private async logWebhook(provider: string, status: 'success' | 'failed', payload: any, error?: any) {
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          provider,
          event: 'payment_tracking',
          status,
          error: error instanceof Error ? error.message : undefined,
          payload,
          metadata: {
            session_id: this.sessionId,
            timestamp: new Date().toISOString()
          }
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
            session_id: this.sessionId,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
          }
        });
    } catch (err) {
      console.error('Error logging error:', err);
    }
  }

  getTrackingData(): TrackingData {
    const params = new URLSearchParams(window.location.search);
    
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined,
      referrer: document.referrer,
      language: navigator.language,
      device_type: this.getDeviceType(),
      user_agent: navigator.userAgent,
      session_id: this.sessionId,
      page_url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }
}