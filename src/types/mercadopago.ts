export interface CardData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

export interface PaymentData {
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
}

export interface PixPaymentData {
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
}

export interface InstallmentOption {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  installment_amount: number;
  total_amount: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  payment_type_id: string;
  status: string;
  secure_thumbnail: string;
  thumbnail: string;
  issuer: {
    id: string;
    name: string;
  };
}