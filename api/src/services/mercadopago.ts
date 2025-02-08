import { MercadoPagoConfig, Payment } from 'mercadopago';
import { LoggingService, LogLevel, LogCategory } from './logging';

export class MercadoPagoService {
  private static instance: MercadoPagoService;
  private client: MercadoPagoConfig;
  private logger: LoggingService;

  private constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
    });
    this.logger = LoggingService.getInstance();
  }

  static getInstance() {
    if (!MercadoPagoService.instance) {
      MercadoPagoService.instance = new MercadoPagoService();
    }
    return MercadoPagoService.instance;
  }

  async createPixPayment(data: {
    amount: number;
    customer: {
      email: string;
      name: string;
      document: string;
    };
  }) {
    try {
      const payment = new Payment(this.client);
      const result = await payment.create({
        transaction_amount: data.amount,
        payment_method_id: 'pix',
        payer: {
          email: data.customer.email,
          first_name: data.customer.name.split(' ')[0],
          last_name: data.customer.name.split(' ').slice(1).join(' '),
          identification: {
            type: 'CPF',
            number: data.customer.document
          }
        }
      });

      this.logger.log({
        level: LogLevel.INFO,
        category: LogCategory.PAYMENT,
        message: 'PIX payment created successfully',
        metadata: {
          payment_id: result.id,
          amount: data.amount
        }
      });

      return {
        qrCode: result.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };
    } catch (err) {
      this.logger.log({
        level: LogLevel.ERROR,
        category: LogCategory.PAYMENT,
        message: 'Error creating PIX payment',
        metadata: { error: err }
      });
      throw err;
    }
  }
}