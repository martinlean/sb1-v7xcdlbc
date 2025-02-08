// Serviço de ofertas melhorado
import { supabase } from './supabase';

interface OfferData {
  name: string;
  internal_name: string;
  price: number;
  currency: string;
  language?: string;
  billing_type: 'one_time' | 'recurring';
  billing_cycle?: number;
  billing_cycle_unit?: 'days' | 'months' | 'years';
  trial_days?: number;
  product_id: string;
  active?: boolean;
}

export class OfferService {
  private static instance: OfferService;

  private constructor() {}

  static getInstance() {
    if (!OfferService.instance) {
      OfferService.instance = new OfferService();
    }
    return OfferService.instance;
  }

  async createOffer(data: OfferData) {
    try {
      // Get browser language
      const browserLanguage = navigator.language;

      // Create offer with browser language in metadata
      const { data: offer, error } = await supabase
        .from('offers')
        .insert({
          ...data,
          metadata: {
            browser_language: browserLanguage,
            country_code: await this.getCountryCode()
          }
        })
        .select()
        .single();

      if (error) throw error;

      return offer;
    } catch (err) {
      console.error('Error creating offer:', err);
      throw err;
    }
  }

  async updateOffer(offerId: string, data: Partial<OfferData>) {
    try {
      const { data: offer, error } = await supabase
        .from('offers')
        .update(data)
        .eq('id', offerId)
        .select()
        .single();

      if (error) throw error;

      return offer;
    } catch (err) {
      console.error('Error updating offer:', err);
      throw err;
    }
  }

  async getOffer(offerId: string) {
    try {
      const { data: offer, error } = await supabase
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

      if (error) throw error;

      return offer;
    } catch (err) {
      console.error('Error getting offer:', err);
      throw err;
    }
  }

  async getProductOffers(productId: string) {
    try {
      const { data: offers, error } = await supabase
        .from('offers')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return offers;
    } catch (err) {
      console.error('Error getting product offers:', err);
      throw err;
    }
  }

  private async getCountryCode(): Promise<string | null> {
    try {
      const response = await fetch('https://ipapi.co/country');
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }
}