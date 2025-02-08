export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  active: boolean;
  hidden: boolean;
  membership_type: 'none' | 'course' | 'subscription' | 'community';
  membership_platform?: string;
  membership_url?: string;
  membership_webhook?: string;
  affiliate_commission: number;
  affiliate_cookie_days: number;
  affiliate_enabled: boolean;
  coproduction_enabled: boolean;
  coproduction_split: number;
  upsell_enabled: boolean;
  upsell_product_id?: string;
  order_bump_enabled: boolean;
  order_bump_product_id?: string;
  custom_checkout_enabled: boolean;
  custom_checkout_theme?: Record<string, any>;
  custom_checkout_fields?: Array<any>;
  tracking_pixels?: Array<any>;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Offer {
  id: string;
  name: string;
  internal_name: string;
  price: number;
  currency: string;
  language: string;
  billing_type: 'one_time' | 'recurring';
  billing_cycle?: number;
  billing_cycle_unit?: 'days' | 'months' | 'years';
  trial_days?: number;
  active: boolean;
  product_id: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalInfo {
  email: string;
  name: string;
  document: string;
  phone: string;
  country: string;
  language: string;
}

export interface PaymentInfo {
  method: 'credit_card' | 'pix';
  cardHolder?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  installments?: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  defaultLanguage: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}