import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

interface DownsellButtonProps {
  productId: string;
  offerId: string;
  originalPaymentIntentId: string;
  className?: string;
}

export default function DownsellButton({ 
  productId, 
  offerId, 
  originalPaymentIntentId,
  className = ''
}: DownsellButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    loadOffer();
  }, [offerId]);

  const loadOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          product:product_id (
            payment_settings
          )
        `)
        .eq('id', offerId)
        .single();

      if (error) throw error;
      setOffer(data);
    } catch (err) {
      console.error('Error loading offer:', err);
      setError('Error loading offer details');
    }
  };

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get original payment method
      const { data: paymentData, error: paymentError } = await supabase
        .rpc('get_payment_method', {
          p_payment_intent_id: originalPaymentIntentId
        });

      if (paymentError) throw paymentError;

      // Create new payment intent for downsell
      const { data: intentData, error: intentError } = await supabase
        .rpc('create_downsell_payment', {
          p_offer_id: offerId,
          p_original_payment_intent_id: originalPaymentIntentId,
          p_payment_method_id: paymentData.payment_method_id
        });

      if (intentError) throw intentError;

      // Load Stripe
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      if (!stripe) throw new Error('Failed to load Stripe');

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(
        intentData.client_secret,
        { payment_method: paymentData.payment_method_id }
      );

      if (confirmError) throw confirmError;

      // Redirect to success page
      window.location.href = offer.product.payment_settings.success_url || '/success';

    } catch (err) {
      console.error('Error processing downsell:', err);
      setError(err instanceof Error ? err.message : 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  if (!offer) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-2 w-full px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 ${className}`}
      >
        {loading ? (
          'Processing...'
        ) : (
          <>
            Yes, I Want This Instead!
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}