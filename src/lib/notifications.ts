// Serviço de notificações melhorado
import { supabase } from './supabase';

interface EmailData {
  email: string;
  name: string;
  amount: number;
  productName: string;
  paymentMethod?: string;
  error?: string;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendPaymentConfirmation(data: EmailData) {
    try {
      const response = await fetch('https://api.rewardsmidia.online/notifications/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_confirmation',
          data: {
            email: data.email,
            name: data.name,
            amount: data.amount,
            productName: data.productName,
            paymentMethod: data.paymentMethod
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send payment confirmation');
      }

      await this.logNotification('payment_confirmation', data.email);
      return true;
    } catch (err) {
      console.error('Error sending payment confirmation:', err);
      await this.logError('payment_confirmation', err);
      return false;
    }
  }

  async sendPaymentFailure(data: EmailData) {
    try {
      const response = await fetch('https://api.rewardsmidia.online/notifications/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_failure',
          data: {
            email: data.email,
            name: data.name,
            amount: data.amount,
            productName: data.productName,
            paymentMethod: data.paymentMethod,
            error: data.error
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send payment failure notification');
      }

      await this.logNotification('payment_failure', data.email);
      return true;
    } catch (err) {
      console.error('Error sending payment failure:', err);
      await this.logError('payment_failure', err);
      return false;
    }
  }

  async sendRefundNotification(data: EmailData) {
    try {
      const response = await fetch('https://api.rewardsmidia.online/notifications/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_refund',
          data: {
            email: data.email,
            name: data.name,
            amount: data.amount,
            productName: data.productName
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send refund notification');
      }

      await this.logNotification('payment_refund', data.email);
      return true;
    } catch (err) {
      console.error('Error sending refund notification:', err);
      await this.logError('payment_refund', err);
      return false;
    }
  }

  private async logNotification(type: string, recipient: string) {
    try {
      await supabase
        .from('notification_logs')
        .insert({
          type,
          recipient,
          status: 'sent',
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
    } catch (err) {
      console.error('Error logging notification:', err);
    }
  }

  private async logError(type: string, error: any) {
    try {
      await supabase
        .from('notification_logs')
        .insert({
          type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
    } catch (err) {
      console.error('Error logging notification error:', err);
    }
  }
}