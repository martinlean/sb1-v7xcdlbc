// Página de sucesso melhorada
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Mail, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TrackingService } from '../lib/tracking';

interface PaymentSuccessProps {
  paymentMethod: 'card' | 'pix';
  amount: number;
  productName: string;
  email: string;
  pixData?: {
    qrCode: string;
    copyPaste: string;
    expiresAt: string;
  };
  productId: string;
  paymentIntentId?: string;
}

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as PaymentSuccessProps;

  useEffect(() => {
    if (!data) {
      navigate('/');
      return;
    }

    checkUpsellSettings();
    trackConversion();
  }, [data]);

  const checkUpsellSettings = async () => {
    try {
      // Get product settings
      const { data: product } = await supabase
        .from('products')
        .select(`
          upsell_settings,
          offers (
            id,
            name,
            price,
            currency,
            language
          )
        `)
        .eq('id', data.productId)
        .single();

      if (product?.upsell_settings?.enabled) {
        // If upsell is enabled and we have a payment intent ID (card payment)
        if (data.paymentMethod === 'card' && data.paymentIntentId) {
          // Redirect to upsell page with payment intent ID
          window.location.href = `/upsell/${product.offers[0].id}?pi=${data.paymentIntentId}`;
          return;
        }
        
        // For PIX payments or if no payment intent, redirect to regular upsell page
        if (product.upsell_settings.success_url) {
          window.location.href = product.upsell_settings.success_url;
          return;
        }
      }
    } catch (err) {
      console.error('Error checking upsell settings:', err);
    }
  };

  const trackConversion = async () => {
    try {
      const trackingService = TrackingService.getInstance();
      await trackingService.trackPageView();
    } catch (err) {
      console.error('Error tracking conversion:', err);
    }
  };

  // Resto do código permanece igual...
}