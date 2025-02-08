import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PaymentData {
  method: 'card' | 'pix';
  amount: number;
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
  card?: {
    number: string;
    holder: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    installments: number;
  };
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (data: PaymentData) => {
    try {
      setLoading(true);
      setError(null);

      // Create customer record
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: data.customer.email,
          name: data.customer.name,
          phone: data.customer.phone || null
        })
        .select()
        .single();

      if (customerError) {
        console.error('Customer error:', customerError);
        throw new Error('Error creating customer');
      }

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          customer_id: customerData.id,
          amount: data.amount,
          currency: 'BRL',
          status: 'pending',
          payment_method: data.method,
          payment_provider: data.method === 'card' ? 'stripe' : 'mercadopago',
          metadata: {
            product_id: data.product.id,
            product_name: data.product.name,
            customer_email: data.customer.email,
            customer_name: data.customer.name,
            customer_document: data.customer.document
          }
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Payment error:', paymentError);
        throw new Error('Error creating payment');
      }

      if (data.method === 'pix') {
        // Generate PIX payment
        const { data: pixData, error: pixError } = await supabase.rpc(
          'generate_pix_payment',
          {
            payment_id: paymentData.id,
            amount: data.amount,
            customer_name: data.customer.name,
            customer_document: data.customer.document?.replace(/\D/g, '')
          }
        );

        if (pixError) {
          console.error('PIX error:', pixError);
          throw new Error('Error generating PIX');
        }

        return {
          success: true,
          pixCopiaECola: pixData.copy_paste,
          pixQRCode: pixData.qr_code_base64,
          expiresAt: pixData.expires_at
        };
      } else {
        // Process card payment
        const { data: cardData, error: cardError } = await supabase.rpc(
          'create_stripe_payment_intent',
          {
            payment_id: paymentData.id,
            amount: Math.round(data.amount * 100),
            currency: 'brl',
            customer_email: data.customer.email,
            card: {
              number: data.card!.number.replace(/\s/g, ''),
              exp_month: data.card!.expMonth,
              exp_year: data.card!.expYear,
              cvc: data.card!.cvv
            }
          }
        );

        if (cardError) {
          console.error('Card error:', cardError);
          throw new Error('Error processing card payment');
        }

        return {
          success: true,
          clientSecret: cardData.client_secret
        };
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Error processing payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { processPayment, loading, error };
}