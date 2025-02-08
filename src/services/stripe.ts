import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

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
    const { data: intentData, error: intentError } = await supabase.rpc(
      'create_stripe_payment_intent',
      {
        amount: data.amount,
        currency: data.currency.toLowerCase(),
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