import { TranslationKeys } from '../types';

const translations: Record<string, TranslationKeys> = {
  'pt-BR': {
    personalInfo: {
      title: 'Dados pessoais',
      name: 'Nome completo',
      namePlaceholder: 'Digite seu nome completo',
      email: 'E-mail',
      emailPlaceholder: 'Digite seu e-mail',
      emailInvalid: 'Por favor, insira um e-mail válido',
      phone: 'Telefone',
      phonePlaceholder: 'Digite seu telefone'
    },
    payment: {
      title: 'Método de pagamento',
      creditCard: 'Cartão de crédito',
      cardHolder: 'Nome no cartão',
      cardHolderPlaceholder: 'Digite o nome como está no cartão',
      cardNumber: 'Número do cartão',
      cardNumberPlaceholder: 'Digite o número do cartão',
      month: 'Mês',
      monthPlaceholder: 'MM',
      year: 'Ano',
      yearPlaceholder: 'AA',
      cvv: 'CVV',
      cvvPlaceholder: 'Digite o CVV',
      installments: 'Parcelas',
      processing: 'Processando...',
      submit: 'Finalizar Pagamento',
      error: 'Erro ao processar pagamento'
    },
    orderSummary: {
      title: 'Resumo do pedido',
      subtotal: 'Subtotal',
      total: 'Total',
      secureEnvironment: 'Ambiente 100% seguro',
      needHelp: 'Precisa de ajuda? Fale com o vendedor pelo e-mail:'
    }
  },
  'en-EU': {
    personalInfo: {
      title: 'Personal Information',
      name: 'Full Name',
      namePlaceholder: 'Enter your full name',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      emailInvalid: 'Please enter a valid email address',
      phone: 'Phone',
      phonePlaceholder: 'Enter your phone number'
    },
    payment: {
      title: 'Payment Method',
      creditCard: 'Credit Card',
      cardHolder: 'Cardholder Name',
      cardHolderPlaceholder: 'Enter name as shown on card',
      cardNumber: 'Card Number',
      cardNumberPlaceholder: 'Enter card number',
      month: 'Month',
      monthPlaceholder: 'MM',
      year: 'Year',
      yearPlaceholder: 'YY',
      cvv: 'CVV',
      cvvPlaceholder: 'Enter CVV',
      installments: 'Installments',
      processing: 'Processing...',
      submit: 'Complete Payment',
      error: 'Error processing payment'
    },
    orderSummary: {
      title: 'Order Summary',
      subtotal: 'Subtotal',
      total: 'Total',
      secureEnvironment: '100% Secure Environment',
      needHelp: 'Need help? Contact the seller at:'
    }
  },
  'en-US': {
    personalInfo: {
      title: 'Personal Information',
      name: 'Full Name',
      namePlaceholder: 'Enter your full name',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      emailInvalid: 'Please enter a valid email address',
      phone: 'Phone',
      phonePlaceholder: 'Enter your phone number'
    },
    payment: {
      title: 'Payment Method',
      creditCard: 'Credit Card',
      cardHolder: 'Cardholder Name',
      cardHolderPlaceholder: 'Enter name as shown on card',
      cardNumber: 'Card Number',
      cardNumberPlaceholder: 'Enter card number',
      month: 'Month',
      monthPlaceholder: 'MM',
      year: 'Year',
      yearPlaceholder: 'YY',
      cvv: 'CVV',
      cvvPlaceholder: 'Enter CVV',
      installments: 'Installments',
      processing: 'Processing...',
      submit: 'Complete Payment',
      error: 'Error processing payment'
    },
    orderSummary: {
      title: 'Order Summary',
      subtotal: 'Subtotal',
      total: 'Total',
      secureEnvironment: '100% Secure Environment',
      needHelp: 'Need help? Contact the seller at:'
    }
  }
};

export const getTranslations = (languageCode: string): TranslationKeys => {
  // Get base language code
  const baseCode = languageCode.split('-')[0];
  
  // Try to find exact match first
  if (translations[languageCode]) {
    return translations[languageCode];
  }
  
  // Try to find a match with the same base language
  const fallbackKey = Object.keys(translations).find(key => key.startsWith(baseCode));
  if (fallbackKey) {
    return translations[fallbackKey];
  }
  
  // Default to US English if no match found
  return translations['en-US'];
};