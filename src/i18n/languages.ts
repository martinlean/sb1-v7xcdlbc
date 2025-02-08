import { Language } from '../types';

export const languages: Language[] = [
  { code: 'pt-BR', name: 'Português (BR)', flag: 'https://flagcdn.com/br.svg' },
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/gb.svg' },
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/es.svg' },
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/fr.svg' },
  { code: 'pt-PT', name: 'Português (PT)', flag: 'https://flagcdn.com/pt.svg' },
  { code: 'ja', name: '日本語', flag: 'https://flagcdn.com/jp.svg' },
  { code: 'zh', name: '中文', flag: 'https://flagcdn.com/cn.svg' },
  { code: 'ar', name: 'العربية', flag: 'https://flagcdn.com/sa.svg' },
  { code: 'it', name: 'Italiano', flag: 'https://flagcdn.com/it.svg' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/de.svg' },
];

export const countryLanguageMap: Record<string, string> = {
  BR: 'pt-BR',
  US: 'en',
  GB: 'en',
  ES: 'es',
  MX: 'es',
  CO: 'es',
  FR: 'fr',
  PT: 'pt-PT',
  JP: 'ja',
  CN: 'zh',
  SA: 'ar',
  IT: 'it',
  DE: 'de',
};