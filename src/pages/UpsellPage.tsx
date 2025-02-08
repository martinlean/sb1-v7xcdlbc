import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Clock, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import UpsellButton from '../components/UpsellButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslations } from '../hooks/useTranslations';

export default function UpsellPage() {
  const { offerId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('pi');
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<any>(null);
  const [downsellOffer, setDownsellOffer] = useState<any>(null);

  useEffect(() => {
    loadOffers();
  }, [offerId]);

  const loadOffers = async () => {
    try {
      if (!offerId) {
        throw new Error('Offer ID is required');
      }

      // Get main upsell offer
      const { data: upsellData, error: upsellError } = await supabase
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

      if (upsellError) throw upsellError;
      if (!upsellData) throw new Error('Offer not found');

      setOffer(upsellData);

      // Get downsell offer if it exists
      if (upsellData.product.upsell_settings?.downsell_offer_id) {
        const { data: downsellData, error: downsellError } = await supabase
          .from('offers')
          .select('*')
          .eq('id', upsellData.product.upsell_settings.downsell_offer_id)
          .single();

        if (!downsellError && downsellData) {
          setDownsellOffer(downsellData);
        }
      }
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(err instanceof Error ? err.message : 'Error loading offer');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    // If there's a downsell offer and payment intent, redirect to downsell page
    if (downsellOffer && paymentIntentId) {
      window.location.href = `/downsell/${downsellOffer.id}?pi=${paymentIntentId}`;
      return;
    }

    // Otherwise go to success page
    window.location.href = offer.product.payment_settings?.success_url || '/';
  };

  if (loading) return <LoadingSpinner />;

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('error')}</h2>
            <p className="text-gray-600">{error || t('offerNotFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  const originalPrice = offer.price * 2; // Example: Show 50% discount
  const savings = originalPrice - offer.price;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('upsell.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('upsell.subtitle')}
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
                <span className="text-xl text-gray-500 line-through">
                  {new Intl.NumberFormat(offer.language, {
                    style: 'currency',
                    currency: offer.currency
                  }).format(originalPrice)}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {t('upsell.save')} {new Intl.NumberFormat(offer.language, {
                    style: 'currency',
                    currency: offer.currency
                  }).format(savings)}
                </span>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">{t('upsell.oneTimePayment')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">{t('upsell.limitedTime')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">{t('upsell.moneyBack')}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              {paymentIntentId ? (
                <UpsellButton
                  productId={offer.product_id}
                  offerId={offer.id}
                  originalPaymentIntentId={paymentIntentId}
                  className="py-4 text-xl"
                />
              ) : (
                <a
                  href={offer.product.upsell_settings?.success_url || '/'}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 text-xl font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  {t('upsell.addToOrder')}
                  <ArrowRight className="w-6 h-6" />
                </a>
              )}

              <button
                onClick={handleDecline}
                className="w-full px-6 py-3 text-gray-500 hover:text-gray-700"
              >
                {t('upsell.noThanks')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}