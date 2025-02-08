import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGeoLocation } from './useGeoLocation';

export function useLanguage() {
  const { language: detectedLanguage } = useGeoLocation();
  const [language, setLanguage] = useState<string>(() => {
    // Try to get saved preference first
    const saved = localStorage.getItem('preferred_language');
    if (saved) return saved;

    // Then try detected language
    if (detectedLanguage) return detectedLanguage;

    // Then try browser language
    const browserLang = navigator.language;
    if (browserLang.match(/^(pt-BR|en-US|en-GB|en-AU|en-CA|es-ES)$/)) {
      return browserLang;
    }

    // Map base language to default variant
    const baseCode = browserLang.split('-')[0].toLowerCase();
    switch(baseCode) {
      case 'pt':
        return 'pt-BR';
      case 'es':
        return 'es-ES';
      case 'en':
        // Try to detect country for English
        const country = detectedLanguage?.split('-')[1] || 'US';
        switch(country) {
          case 'GB':
            return 'en-GB';
          case 'AU':
            return 'en-AU';
          case 'CA':
            return 'en-CA';
          default:
            return 'en-US';
        }
      default:
        return 'en-US';
    }
  });

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('preferred_language', language);

    // Also update user preference in database if logged in
    const updateUserPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('seller_profiles')
          .update({ preferred_language: language })
          .eq('user_id', user.id);
      }
    };

    updateUserPreference();
  }, [language]);

  return {
    language,
    setLanguage
  };
}