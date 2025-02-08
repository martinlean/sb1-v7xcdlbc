import { supabase } from '../lib/supabase';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum LogCategory {
  PAYMENT = 'payment',
  WEBHOOK = 'webhook',
  INTEGRATION = 'integration',
  SECURITY = 'security'
}

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  user_id?: string;
  payment_id?: string;
}

export class LoggingService {
  private static instance: LoggingService;

  private constructor() {}

  static getInstance() {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  async log(entry: LogEntry) {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          level: entry.level,
          category: entry.category,
          message: entry.message,
          metadata: entry.metadata,
          user_id: entry.user_id,
          payment_id: entry.payment_id
        });

      if (error) throw error;

      // Se for erro, também enviar para serviço de monitoramento
      if (entry.level === LogLevel.ERROR) {
        await this.notifyError(entry);
      }
    } catch (err) {
      console.error('Error logging entry:', err);
      // Fallback para console em caso de erro
      console.log({
        timestamp: new Date().toISOString(),
        ...entry
      });
    }
  }

  private async notifyError(entry: LogEntry) {
    try {
      await fetch('https://api.rewardsmidia.online/monitoring/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (err) {
      console.error('Error notifying monitoring service:', err);
    }
  }
}