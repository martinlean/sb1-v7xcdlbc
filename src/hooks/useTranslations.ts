import { useCallback } from 'react';
import { getTranslations } from '../i18n/translations';

export const useTranslations = (languageCode: string) => {
  const t = useCallback((key: string) => {
    const translations = getTranslations(languageCode);
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  }, [languageCode]);

  return { t };
};