import { loadMercadoPago } from '@mercadopago/sdk-js';

const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

let mercadopago: any = null;

export const initMercadoPago = async () => {
  try {
    await loadMercadoPago();
    mercadopago = new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY);
    return mercadopago;
  } catch (error) {
    console.error('Error initializing MercadoPago:', error);
    throw error;
  }
};

export const createCardToken = async (cardData: {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}) => {
  try {
    if (!mercadopago) {
      await initMercadoPago();
    }

    const token = await mercadopago.createCardToken({
      cardNumber: cardData.cardNumber.replace(/\s/g, ''),
      cardholderName: cardData.cardholderName,
      cardExpirationMonth: cardData.cardExpirationMonth,
      cardExpirationYear: cardData.cardExpirationYear,
      securityCode: cardData.securityCode,
      identificationType: cardData.identificationType,
      identificationNumber: cardData.identificationNumber
    });

    return token;
  } catch (error) {
    console.error('Error creating card token:', error);
    throw error;
  }
};

export const getInstallments = async (amount: number, bin: string) => {
  try {
    if (!mercadopago) {
      await initMercadoPago();
    }

    const installments = await mercadopago.getInstallments({
      amount: amount.toString(),
      bin,
      locale: 'pt-BR',
      processingMode: 'aggregator'
    });

    return installments[0];
  } catch (error) {
    console.error('Error getting installments:', error);
    throw error;
  }
};

export const getPaymentMethods = async (bin: string) => {
  try {
    if (!mercadopago) {
      await initMercadoPago();
    }

    const paymentMethods = await mercadopago.getPaymentMethods({
      bin,
      processingMode: 'aggregator'
    });

    return paymentMethods;
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw error;
  }
};

export const createPayment = async (data: {
  token: string;
  issuerId: string;
  paymentMethodId: string;
  installments: number;
  amount: number;
  description: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}) => {
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction_amount: data.amount,
        token: data.token,
        description: data.description,
        installments: data.installments,
        payment_method_id: data.paymentMethodId,
        issuer_id: data.issuerId,
        payer: data.payer
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error processing payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const createPixPayment = async (data: {
  amount: number;
  description: string;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    identification: {
      type: string;
      number: string;
    };
  };
}) => {
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction_amount: data.amount,
        description: data.description,
        payment_method_id: 'pix',
        payer: data.payer
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creating PIX payment');
    }

    const result = await response.json();
    return {
      qrCode: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
      expirationDate: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };
  } catch (error) {
    console.error('Error creating PIX payment:', error);
    throw error;
  }
};