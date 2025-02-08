import { supabase } from '../lib/supabase';
import { NotificationService } from './notifications';

export class AffiliateService {
  private static instance: AffiliateService;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance() {
    if (!AffiliateService.instance) {
      AffiliateService.instance = new AffiliateService();
    }
    return AffiliateService.instance;
  }

  async applyForProgram(productId: string, data: {
    motivation: string;
    experience: string;
    promotion_strategy: string;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('affiliates')
        .select('status')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingApplication) {
        throw new Error('Você já se candidatou para este programa de afiliados');
      }

      // Create application
      const { error: insertError } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          product_id: productId,
          status: 'pending',
          application_data: data
        });

      if (insertError) throw insertError;

      // Notify product owner
      const { data: product } = await supabase
        .from('products')
        .select('*, seller_profiles(*)')
        .eq('id', productId)
        .single();

      if (product) {
        await this.notificationService.sendAffiliateApplication({
          email: product.seller_profiles.email,
          productName: product.name,
          affiliateName: user.user_metadata.name || user.email,
          affiliateEmail: user.email
        });
      }

      return true;
    } catch (err) {
      console.error('Error applying for affiliate program:', err);
      throw err;
    }
  }

  async approveAffiliate(affiliateId: string) {
    try {
      const { data: affiliate, error: updateError } = await supabase
        .from('affiliates')
        .update({ status: 'approved' })
        .eq('id', affiliateId)
        .select('*, products(*), auth.users(*)')
        .single();

      if (updateError) throw updateError;

      if (affiliate) {
        // Send approval notification
        await this.notificationService.sendAffiliateApproved({
          email: affiliate.users.email,
          productName: affiliate.products.name,
          commission: affiliate.products.affiliate_commission,
          affiliateUrl: `https://checkout.rewardsmidia.online/${affiliate.product_id}/ref/${affiliate.id}`
        });
      }

      return true;
    } catch (err) {
      console.error('Error approving affiliate:', err);
      throw err;
    }
  }

  async rejectAffiliate(affiliateId: string, reason: string) {
    try {
      const { data: affiliate, error: updateError } = await supabase
        .from('affiliates')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', affiliateId)
        .select('*, products(*), auth.users(*)')
        .single();

      if (updateError) throw updateError;

      if (affiliate) {
        // Send rejection notification
        await this.notificationService.sendAffiliateRejected({
          email: affiliate.users.email,
          productName: affiliate.products.name,
          reason
        });
      }

      return true;
    } catch (err) {
      console.error('Error rejecting affiliate:', err);
      throw err;
    }
  }

  async getAffiliateStats(affiliateId: string) {
    try {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_affiliate_stats', { affiliate_id: affiliateId });

      if (statsError) throw statsError;

      return stats || {
        total_sales: 0,
        total_commission: 0,
        available_balance: 0,
        pending_balance: 0,
        withdrawn_balance: 0,
        conversion_rate: 0,
        clicks: 0
      };
    } catch (err) {
      console.error('Error getting affiliate stats:', err);
      throw err;
    }
  }

  async requestWithdrawal(amount: number, paymentInfo: {
    method: 'pix' | 'bank_transfer';
    pix_key?: string;
    bank_info?: {
      bank: string;
      agency: string;
      account: string;
      document: string;
    };
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate available balance
      const stats = await this.getAffiliateStats(user.id);
      if (amount > stats.available_balance) {
        throw new Error('Saldo insuficiente');
      }

      // Create withdrawal request
      const { error: withdrawalError } = await supabase
        .from('affiliate_withdrawals')
        .insert({
          affiliate_id: user.id,
          amount,
          status: 'pending',
          payment_method: paymentInfo.method,
          payment_info: paymentInfo
        });

      if (withdrawalError) throw withdrawalError;

      return true;
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      throw err;
    }
  }

  async getAffiliateLinks(productId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('status', 'approved')
        .single();

      if (!affiliate) {
        throw new Error('Você não é um afiliado aprovado para este produto');
      }

      const baseUrl = `https://checkout.rewardsmidia.online/${productId}/ref/${affiliate.id}`;

      return {
        default: baseUrl,
        facebook: `${baseUrl}?utm_source=facebook&utm_medium=social`,
        instagram: `${baseUrl}?utm_source=instagram&utm_medium=social`,
        email: `${baseUrl}?utm_source=email&utm_medium=email`,
        whatsapp: `${baseUrl}?utm_source=whatsapp&utm_medium=messaging`
      };
    } catch (err) {
      console.error('Error getting affiliate links:', err);
      throw err;
    }
  }
}