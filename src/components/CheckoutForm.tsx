import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Shield, Clock, CheckCircle, X, AlertCircle, CreditCard, QrCode, ArrowRight } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { supabase } from '../lib/supabase';
import { createPaymentIntent } from '../lib/stripe';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSelector from './LanguageSelector';
import LoadingSpinner from './LoadingSpinner';
import NoProductFound from './NoProductFound';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface FormData {
  email: string;
  name: string;
  phone: string;
}

function CheckoutForm() {
  const { productId, offerId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [offer, setOffer] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<FormData>({
    email: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    loadProductAndOffer();
  }, [productId, offerId]);

  const loadProductAndOffer = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get offer details first
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select(`
          *,
          products:product_id (
            *,
            payment_settings
          )
        `)
        .eq('id', offerId)
        .eq('product_id', productId)
        .single();

      if (offerError) throw offerError;
      if (!offerData) throw new Error('Offer not found');

      setOffer(offerData);
      setProduct(offerData.products);

      // Create payment intent
      const { clientSecret } = await createPaymentIntent({
        amount: offerData.price,
        currency: offerData.currency.toLowerCase(),
        customer: {
          email: customerData.email || 'guest@example.com',
          name: customerData.name || 'Guest Customer'
        }
      });

      setClientSecret(clientSecret);
    } catch (err) {
      console.error('Error loading product/offer:', err);
      setError(err instanceof Error ? err.message : 'Error loading checkout');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('payment.error')}</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !offer || !product) {
    return <NoProductFound />;
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        locale: language,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
          }
        }
      }}
    >
      <CheckoutFormContent 
        offer={offer} 
        product={product} 
        onCustomerDataChange={setCustomerData}
      />
    </Elements>
  );
}

function CheckoutFormContent({ offer, product, onCustomerDataChange }: { 
  offer: any; 
  product: any;
  onCustomerDataChange: (data: FormData) => void;
}) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslations(language);
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (stripe) {
      setLoading(false);
    }
  }, [stripe]);

  useEffect(() => {
    onCustomerDataChange(formData);
  }, [formData, onCustomerDataChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!stripe || !elements) {
        throw new Error(t('payment.error'));
      }

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: {
              name: formData.name,
              email: formData.email
            }
          }
        }
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : t('payment.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector 
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        </div>

        {/* Left Column - Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-gray-900">{t('personalInfo.title')}</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('personalInfo.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('personalInfo.namePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('personalInfo.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('personalInfo.emailPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('personalInfo.phone')} <span className="text-red-500">*</span>
                  </label>
                  <IMaskInput
                    mask="+{0}000000000000"
                    value={formData.phone}
                    onAccept={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('personalInfo.phonePlaceholder')}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-6">{t('payment.title')}</h2>
              <div className="space-y-4">
                <PaymentElement 
                  options={{
                    defaultValues: {
                      billingDetails: {
                        name: formData.name,
                        email: formData.email
                      }
                    },
                    business: {
                      name: product.billing_name
                    },
                    fields: {
                      billingDetails: 'never'
                    }
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !stripe}
              className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium text-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? t('payment.processing') : t('payment.submit')}
            </button>
          </form>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="aspect-w-16 aspect-h-9 mb-6">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{t('orderSummary.subtotal')}</span>
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat(language, {
                    style: 'currency',
                    currency: offer.currency
                  }).format(offer.price)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-gray-900">{t('orderSummary.total')}</span>
                <span className="text-gray-900">
                  {new Intl.NumberFormat(language, {
                    style: 'currency',
                    currency: offer.currency
                  }).format(offer.price)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>{t('orderSummary.secureEnvironment')}</span>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>{t('orderSummary.needHelp')}</p>
            <a href={`mailto:${product.support_email}`} className="text-blue-500 hover:text-blue-600">
              {product.support_email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutForm;