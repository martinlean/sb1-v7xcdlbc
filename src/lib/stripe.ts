import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Lista completa de moedas suportadas pelo Stripe
const SUPPORTED_CURRENCIES = [
  'usd', 'eur', 'gbp', 'brl', 'aud', 'cad', 'chf', 'cny', 'jpy', 'inr',
  'dkk', 'nok', 'sek', 'hkd', 'sgd', 'mxn', 'ars', 'clp', 'cop'
].map(c => c.toLowerCase());

export const createPaymentIntent = async (data: {
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
  };
  metadata?: Record<string, any>;
}) => {
  try {
    // Validar a moeda
    const currency = data.currency.toLowerCase();
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      throw new Error(`Invalid currency. Supported currencies are: ${SUPPORTED_CURRENCIES.join(', ').toUpperCase()}`);
    }

    // Call our Supabase function to create payment intent
    const { data: intentData, error: intentError } = await supabase.rpc(
      'create_stripe_payment_intent',
      {
        amount: data.amount,
        currency: currency,
        customer_email: data.customer.email,
        customer_name: data.customer.name
      }
    );

    if (intentError) {
      console.error('Error creating payment intent:', intentError);
      throw intentError;
    }

    if (!intentData.client_secret) {
      throw new Error('No client secret returned');
    }

    return {
      clientSecret: intentData.client_secret,
      publishableKey: STRIPE_PUBLIC_KEY
    };
  } catch (err) {
    console.error('Error creating payment intent:', err);
    throw err;
  }
};

export const confirmCardPayment = async (
  clientSecret: string,
  paymentMethod: {
    card: any;
    billing_details: {
      name: string;
      email: string;
    };
  }
) => {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });

    if (error) {
      throw error;
    }

    return { success: true, paymentIntent };
  } catch (err) {
    console.error('Error confirming card payment:', err);
    throw err;
  }
};