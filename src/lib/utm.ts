import { supabase } from './supabase';

interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  language?: string;
}

// Get UTM parameters from URL
export function getUTMParams(): UTMParams {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
    referrer: document.referrer || undefined,
    language: navigator.language || undefined
  };
}

// Store UTM parameters in session storage
export function storeUTMParams(utmParams: UTMParams): void {
  sessionStorage.setItem('utm_params', JSON.stringify({
    ...utmParams,
    timestamp: Date.now()
  }));
}

// Get stored UTM parameters
export function getStoredUTMParams(): UTMParams | null {
  const stored = sessionStorage.getItem('utm_params');
  if (!stored) return null;

  const data = JSON.parse(stored);
  const timestamp = data.timestamp;

  // Expire after 30 minutes
  if (Date.now() - timestamp > 30 * 60 * 1000) {
    sessionStorage.removeItem('utm_params');
    return null;
  }

  delete data.timestamp;
  return data;
}

// Track UTM conversion
export async function trackUTMConversion(paymentId: string, utmParams: UTMParams) {
  try {
    // Update payment with UTM data
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        utm_source: utmParams.source,
        utm_medium: utmParams.medium,
        utm_campaign: utmParams.campaign,
        utm_term: utmParams.term,
        utm_content: utmParams.content,
        tracking_data: {
          ...utmParams,
          conversion_url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', paymentId);

    if (updateError) throw updateError;

    // Send to UTMify if enabled
    const { data: sellerProfile } = await supabase
      .from('seller_profiles')
      .select('utmify_settings')
      .single();

    if (sellerProfile?.utmify_settings?.enabled) {
      await sendToUTMify(paymentId, utmParams, sellerProfile.utmify_settings);
    }

  } catch (err) {
    console.error('Error tracking UTM conversion:', err);
  }
}

// Send data to UTMify
async function sendToUTMify(paymentId: string, utmParams: UTMParams, settings: any) {
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
      utm: utmParams,
      metadata: {
        ...payment.metadata,
        conversion_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      },
      created_at: payment.created_at
    };

    // Send to UTMify webhook
    const response = await fetch(settings.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.api_token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`UTMify API error: ${response.statusText}`);
    }

  } catch (err) {
    console.error('Error sending data to UTMify:', err);
  }
}