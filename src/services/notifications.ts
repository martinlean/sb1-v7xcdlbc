import { supabase } from '../lib/supabase';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async sendNotification(type: string, recipient: string, data: any) {
    try {
      const response = await fetch('https://api.rewardsmidia.online/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, recipient, data })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      // Log notification
      await supabase
        .from('notification_logs')
        .insert({
          type,
          recipient,
          status: 'sent',
          metadata: data
        });

      return true;
    } catch (err) {
      console.error('Error sending notification:', err);
      
      // Log failed notification
      await supabase
        .from('notification_logs')
        .insert({
          type,
          recipient,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          metadata: data
        });

      return false;
    }
  }

  // Existing notification methods...

  async sendAffiliateApplication(data: {
    email: string;
    productName: string;
    affiliateName: string;
    affiliateEmail: string;
  }) {
    return this.sendNotification('affiliate_application', data.email, {
      product_name: data.productName,
      affiliate_name: data.affiliateName,
      affiliate_email: data.affiliateEmail
    });
  }

  async sendAffiliateApproved(data: {
    email: string;
    productName: string;
    commission: number;
    affiliateUrl: string;
  }) {
    return this.sendNotification('affiliate_approved', data.email, {
      product_name: data.productName,
      commission: data.commission,
      affiliate_url: data.affiliateUrl
    });
  }

  async sendAffiliateRejected(data: {
    email: string;
    productName: string;
    reason: string;
  }) {
    return this.sendNotification('affiliate_rejected', data.email, {
      product_name: data.productName,
      reason: data.reason
    });
  }

  async sendAffiliateSale(data: {
    email: string;
    productName: string;
    commission: number;
    saleAmount: number;
    customerName: string;
  }) {
    return this.sendNotification('affiliate_sale', data.email, {
      product_name: data.productName,
      commission: data.commission,
      sale_amount: data.saleAmount,
      customer_name: data.customerName
    });
  }

  async sendAffiliateWithdrawalApproved(data: {
    email: string;
    amount: number;
    paymentMethod: string;
  }) {
    return this.sendNotification('affiliate_withdrawal_approved', data.email, {
      amount: data.amount,
      payment_method: data.paymentMethod
    });
  }

  async sendAffiliateWithdrawalRejected(data: {
    email: string;
    amount: number;
    reason: string;
  }) {
    return this.sendNotification('affiliate_withdrawal_rejected', data.email, {
      amount: data.amount,
      reason: data.reason
    });
  }

  async sendAffiliateCommissionPaid(data: {
    email: string;
    amount: number;
    productName: string;
    period: {
      start: string;
      end: string;
    };
  }) {
    return this.sendNotification('affiliate_commission_paid', data.email, {
      amount: data.amount,
      product_name: data.productName,
      period_start: data.period.start,
      period_end: data.period.end
    });
  }
}