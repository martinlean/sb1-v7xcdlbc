import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Clock, Shield, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DownsellButton from '../components/DownsellButton';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DownsellPage() {
  const { offerId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('pi');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    loadOffer();
  }, [offerId]);

  const loadOffer = async () => {
    try {
      if (!offerId) {
        throw new Error('Offer ID is required');
      }

      const { data, error: offerError } = await supabase
        .from('offers')
        .select(`
          *,
          product:product_id (
            name,
            description,
            image,
            payment_settings,
            upsell_settings
          )
        `)
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;
      if (!data) throw new Error('Offer not found');

      setOffer(data);
    } catch (err) {
      console.error('Error loading offer:', err);
      setError(err instanceof Error ? err.message : 'Error loading offer');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error || 'Offer not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Wait! We Have a Special Alternative
          </h1>
          <p className="text-xl text-gray-600">
            Get similar benefits at a more affordable price!
          </p>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Product image */}
          <img
            src={offer.product.image}
            alt={offer.product.name}
            className="w-full h-64 object-cover"
          />

          <div className="p-6 md:p-8">
            {/* Product info */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {offer.product.name}
              </h2>
              <p className="text-gray-600 mb-6">
                {offer.product.description}
              </p>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat(offer.language, {
                    style: 'currency',
                    currency: offer.currency
                  }).format(offer.price)}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Best Value Option
                </span>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Most popular alternative</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Includes essential features</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">30-day money-back guarantee</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              {paymentIntentId ? (
                <DownsellButton
                  productId={offer.product_id}
                  offerId={offer.id}
                  originalPaymentIntentId={paymentIntentId}
                  className="py-4 text-xl"
                />
              ) : (
                <a
                  href={offer.product.upsell_settings?.success_url || '/'}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 text-xl font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Yes, I Want This Instead!
                  <ArrowRight className="w-6 h-6" />
                </a>
              )}

              <button
                onClick={() => {
                  window.location.href = offer.product.payment_settings?.success_url || '/';
                }}
                className="w-full px-6 py-3 text-gray-500 hover:text-gray-700"
              >
                No thanks, I'll pass
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}