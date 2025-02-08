import { useState, useEffect } from 'react';
import { getCurrencyByCountry, getLanguageByCountry } from '../config/currencies';

interface GeoLocation {
  country: string;
  currency: string;
  language: string;
  loading: boolean;
  error: string | null;
}

export function useGeoLocation() {
  const [location, setLocation] = useState<GeoLocation>({
    country: 'BR', // Default to Brazil
    currency: 'BRL',
    language: 'pt-BR',
    loading: true,
    error: null
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location from browser first
        const browserLang = navigator.language;
        const [baseCode, countryCode] = browserLang.split('-');
        
        let detectedCountry = countryCode;
        
        // Map language to likely country if no country code
        if (!detectedCountry) {
          switch(baseCode.toLowerCase()) {
            case 'pt':
              detectedCountry = 'BR';
              break;
            case 'es':
              detectedCountry = 'ES';
              break;
            case 'en':
            default:
              detectedCountry = 'US';
              break;
          }
        }

        // Get currency and language based on country
        const currency = getCurrencyByCountry(detectedCountry);
        let language = getLanguageByCountry(detectedCountry);

        // Use browser language if it matches supported format
        if (browserLang.match(/^(en-US|en-GB|en-AU|en-CA|pt-BR|es-ES)$/)) {
          language = browserLang;
        }
        // Otherwise map base language to default variant
        else if (baseCode) {
          switch(baseCode.toLowerCase()) {
            case 'pt':
              language = 'pt-BR';
              break;
            case 'es':
              language = 'es-ES';
              break;
            case 'en':
              language = 'en-US';
              break;
          }
        }

        setLocation({
          country: detectedCountry,
          currency: currency?.code || 'BRL',
          language: language || 'pt-BR',
          loading: false,
          error: null
        });

      } catch (err) {
        console.error('Error detecting location:', err);
        // Fallback to Brazil defaults
        setLocation({
          country: 'BR',
          currency: 'BRL',
          language: 'pt-BR',
          loading: false,
          error: err instanceof Error ? err.message : 'Error detecting location'
        });
      }
    };

    detectLocation();
  }, []);

  return location;
}