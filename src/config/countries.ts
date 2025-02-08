// Lista completa de países suportados
export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  format: string;
  languages: string[];
}

export const countries: Country[] = [
  // América Latina
  {
    code: 'BR',
    name: 'Brasil',
    flag: 'https://flagcdn.com/br.svg',
    phoneCode: '55',
    format: '(00) 00000-0000',
    languages: ['pt-BR']
  },
  {
    code: 'MX',
    name: 'México',
    flag: 'https://flagcdn.com/mx.svg', 
    phoneCode: '52',
    format: '(00) 0000-0000',
    languages: ['es-MX']
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: 'https://flagcdn.com/ar.svg',
    phoneCode: '54',
    format: '(00) 0000-0000',
    languages: ['es-AR']
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: 'https://flagcdn.com/co.svg',
    phoneCode: '57',
    format: '(000) 000-0000',
    languages: ['es-CO']
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: 'https://flagcdn.com/cl.svg',
    phoneCode: '56',
    format: '(00) 0000-0000',
    languages: ['es-CL']
  },
  {
    code: 'PE',
    name: 'Perú',
    flag: 'https://flagcdn.com/pe.svg',
    phoneCode: '51',
    format: '(00) 0000-0000',
    languages: ['es-PE']
  },
  {
    code: 'VE',
    name: 'Venezuela',
    flag: 'https://flagcdn.com/ve.svg',
    phoneCode: '58',
    format: '(000) 000-0000',
    languages: ['es-VE']
  },
  {
    code: 'EC',
    name: 'Ecuador',
    flag: 'https://flagcdn.com/ec.svg',
    phoneCode: '593',
    format: '(00) 000-0000',
    languages: ['es-EC']
  },
  {
    code: 'BO',
    name: 'Bolivia',
    flag: 'https://flagcdn.com/bo.svg',
    phoneCode: '591',
    format: '0000-0000',
    languages: ['es-BO']
  },
  {
    code: 'PY',
    name: 'Paraguay',
    flag: 'https://flagcdn.com/py.svg',
    phoneCode: '595',
    format: '(000) 000-000',
    languages: ['es-PY']
  },
  {
    code: 'UY',
    name: 'Uruguay',
    flag: 'https://flagcdn.com/uy.svg',
    phoneCode: '598',
    format: '0000-0000',
    languages: ['es-UY']
  },

  // América do Norte
  {
    code: 'US',
    name: 'United States',
    flag: 'https://flagcdn.com/us.svg',
    phoneCode: '1',
    format: '(000) 000-0000',
    languages: ['en-US']
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: 'https://flagcdn.com/ca.svg',
    phoneCode: '1',
    format: '(000) 000-0000',
    languages: ['en-CA', 'fr-CA']
  },

  // Europa
  {
    code: 'ES',
    name: 'España',
    flag: 'https://flagcdn.com/es.svg',
    phoneCode: '34',
    format: '000 000 000',
    languages: ['es-ES']
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: 'https://flagcdn.com/pt.svg',
    phoneCode: '351',
    format: '000 000 000',
    languages: ['pt-PT']
  },
  {
    code: 'FR',
    name: 'France',
    flag: 'https://flagcdn.com/fr.svg',
    phoneCode: '33',
    format: '00 00 00 00 00',
    languages: ['fr-FR']
  },
  {
    code: 'DE',
    name: 'Deutschland',
    flag: 'https://flagcdn.com/de.svg',
    phoneCode: '49',
    format: '00000 000000',
    languages: ['de-DE']
  },
  {
    code: 'IT',
    name: 'Italia',
    flag: 'https://flagcdn.com/it.svg',
    phoneCode: '39',
    format: '000 000 0000',
    languages: ['it-IT']
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: 'https://flagcdn.com/gb.svg',
    phoneCode: '44',
    format: '00000 000000',
    languages: ['en-GB']
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: 'https://flagcdn.com/ie.svg',
    phoneCode: '353',
    format: '000 000 000',
    languages: ['en-IE']
  },
  {
    code: 'NL',
    name: 'Nederland',
    flag: 'https://flagcdn.com/nl.svg',
    phoneCode: '31',
    format: '00 000 0000',
    languages: ['nl-NL']
  },
  {
    code: 'BE',
    name: 'België',
    flag: 'https://flagcdn.com/be.svg',
    phoneCode: '32',
    format: '000 00 00 00',
    languages: ['nl-BE', 'fr-BE']
  },
  {
    code: 'CH',
    name: 'Schweiz',
    flag: 'https://flagcdn.com/ch.svg',
    phoneCode: '41',
    format: '000 000 00 00',
    languages: ['de-CH', 'fr-CH', 'it-CH']
  },
  {
    code: 'AT',
    name: 'Österreich',
    flag: 'https://flagcdn.com/at.svg',
    phoneCode: '43',
    format: '0000 000000',
    languages: ['de-AT']
  },
  {
    code: 'SE',
    name: 'Sverige',
    flag: 'https://flagcdn.com/se.svg',
    phoneCode: '46',
    format: '000-000 00 00',
    languages: ['sv-SE']
  },
  {
    code: 'NO',
    name: 'Norge',
    flag: 'https://flagcdn.com/no.svg',
    phoneCode: '47',
    format: '000 00 000',
    languages: ['nb-NO']
  },
  {
    code: 'DK',
    name: 'Danmark',
    flag: 'https://flagcdn.com/dk.svg',
    phoneCode: '45',
    format: '00 00 00 00',
    languages: ['da-DK']
  },
  {
    code: 'FI',
    name: 'Suomi',
    flag: 'https://flagcdn.com/fi.svg',
    phoneCode: '358',
    format: '000 000 0000',
    languages: ['fi-FI']
  },

  // Ásia
  {
    code: 'JP',
    name: '日本',
    flag: 'https://flagcdn.com/jp.svg',
    phoneCode: '81',
    format: '000-0000-0000',
    languages: ['ja-JP']
  },
  {
    code: 'KR',
    name: '대한민국',
    flag: 'https://flagcdn.com/kr.svg',
    phoneCode: '82',
    format: '000-0000-0000',
    languages: ['ko-KR']
  },
  {
    code: 'CN',
    name: '中国',
    flag: 'https://flagcdn.com/cn.svg',
    phoneCode: '86',
    format: '000 0000 0000',
    languages: ['zh-CN']
  },
  {
    code: 'HK',
    name: '香港',
    flag: 'https://flagcdn.com/hk.svg',
    phoneCode: '852',
    format: '0000 0000',
    languages: ['zh-HK']
  },
  {
    code: 'TW',
    name: '台灣',
    flag: 'https://flagcdn.com/tw.svg',
    phoneCode: '886',
    format: '0000-000-000',
    languages: ['zh-TW']
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: 'https://flagcdn.com/sg.svg',
    phoneCode: '65',
    format: '0000 0000',
    languages: ['en-SG', 'zh-SG']
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: 'https://flagcdn.com/my.svg',
    phoneCode: '60',
    format: '000-000 0000',
    languages: ['ms-MY', 'en-MY']
  },
  {
    code: 'ID',
    name: 'Indonesia',
    flag: 'https://flagcdn.com/id.svg',
    phoneCode: '62',
    format: '000-0000-0000',
    languages: ['id-ID']
  },
  {
    code: 'TH',
    name: 'ไทย',
    flag: 'https://flagcdn.com/th.svg',
    phoneCode: '66',
    format: '000-000-0000',
    languages: ['th-TH']
  },
  {
    code: 'VN',
    name: 'Việt Nam',
    flag: 'https://flagcdn.com/vn.svg',
    phoneCode: '84',
    format: '000 000 0000',
    languages: ['vi-VN']
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: 'https://flagcdn.com/ph.svg',
    phoneCode: '63',
    format: '0000 000 0000',
    languages: ['en-PH', 'fil-PH']
  },

  // Oceania
  {
    code: 'AU',
    name: 'Australia',
    flag: 'https://flagcdn.com/au.svg',
    phoneCode: '61',
    format: '0000 000 000',
    languages: ['en-AU']
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: 'https://flagcdn.com/nz.svg',
    phoneCode: '64',
    format: '000 000 0000',
    languages: ['en-NZ']
  }
];

// Helper functions
export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export function getPhoneFormat(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country?.format || '000 000 0000';
}

export function getDefaultCountry(browserLanguage: string, countryCode?: string): Country {
  // Try country code first
  if (countryCode) {
    const country = getCountryByCode(countryCode);
    if (country) return country;
  }

  // Try browser language
  const [lang, country] = browserLanguage.split('-');
  if (country) {
    const foundCountry = getCountryByCode(country);
    if (foundCountry) return foundCountry;
  }

  // Map common languages to countries
  switch (lang.toLowerCase()) {
    case 'pt':
      return getCountryByCode('BR') || countries[0];
    case 'es':
      return getCountryByCode('ES') || countries[0];
    case 'fr':
      return getCountryByCode('FR') || countries[0];
    case 'de':
      return getCountryByCode('DE') || countries[0];
    case 'it':
      return getCountryByCode('IT') || countries[0];
    case 'ja':
      return getCountryByCode('JP') || countries[0];
    case 'ko':
      return getCountryByCode('KR') || countries[0];
    case 'zh':
      return getCountryByCode('CN') || countries[0];
    case 'nl':
      return getCountryByCode('NL') || countries[0];
    case 'sv':
      return getCountryByCode('SE') || countries[0];
    case 'da':
      return getCountryByCode('DK') || countries[0];
    case 'fi':
      return getCountryByCode('FI') || countries[0];
    case 'nb':
      return getCountryByCode('NO') || countries[0];
    case 'th':
      return getCountryByCode('TH') || countries[0];
    case 'vi':
      return getCountryByCode('VN') || countries[0];
    case 'id':
      return getCountryByCode('ID') || countries[0];
    case 'ms':
      return getCountryByCode('MY') || countries[0];
    case 'fil':
      return getCountryByCode('PH') || countries[0];
    default:
      return getCountryByCode('US') || countries[0];
  }
}