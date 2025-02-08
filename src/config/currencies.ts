export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  countryCode: string;
  phoneFormat: string;
  language: string;
  languages: string[];
}

export const currencies: Currency[] = [
  // Brazil first
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: 'https://flagcdn.com/br.svg',
    countryCode: 'BR',
    phoneFormat: '(00) 00000-0000',
    language: 'pt-BR',
    languages: ['pt-BR']
  },
  // USD with multiple languages
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: 'https://flagcdn.com/us.svg',
    countryCode: 'US',
    phoneFormat: '(000) 000-0000',
    language: 'en-US',
    languages: ['en-US', 'en-GB', 'en-AU', 'en-CA', 'es-ES']
  },
  // EUR with multiple languages
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: 'https://flagcdn.com/eu.svg',
    countryCode: 'EU',
    phoneFormat: '+00 000 000 000',
    language: 'en-EU',
    languages: ['en-EU', 'es-ES', 'fr-FR', 'de-DE', 'it-IT']
  }
];

// Helper functions
export function getCurrencyByCode(code: string): Currency | undefined {
  return currencies.find(c => c.code.toLowerCase() === code.toLowerCase());
}

export function getCurrencyByCountry(countryCode: string): Currency | undefined {
  return currencies.find(c => c.countryCode.toLowerCase() === countryCode.toLowerCase());
}

export function getLanguageByCountry(countryCode: string): string | undefined {
  const currency = getCurrencyByCountry(countryCode);
  return currency?.language;
}

export function getPhoneFormatByCountry(countryCode: string): string {
  const currency = getCurrencyByCountry(countryCode);
  return currency?.phoneFormat || '(000) 000-0000'; // Default US format
}