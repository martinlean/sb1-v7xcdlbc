import React, { useState } from 'react';
import { X, Globe } from 'lucide-react';
import { Country, Language } from '../types';
import { languages } from '../i18n/languages';

interface CountrySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: Country;
  selectedLanguage: Language;
  onSelect: (country: Country, language: Language) => void;
}

const countries: Country[] = [
  { code: 'BR', name: 'Brasil', flag: 'https://flagcdn.com/br.svg', defaultLanguage: 'pt-BR' },
  { code: 'US', name: 'United States', flag: 'https://flagcdn.com/us.svg', defaultLanguage: 'en' },
  { code: 'AR', name: 'Argentina', flag: 'https://flagcdn.com/ar.svg', defaultLanguage: 'es' },
  { code: 'IT', name: 'Italia', flag: 'https://flagcdn.com/it.svg', defaultLanguage: 'it' },
  { code: 'DE', name: 'Deutschland', flag: 'https://flagcdn.com/de.svg', defaultLanguage: 'de' },
  { code: 'SA', name: 'السعودية', flag: 'https://flagcdn.com/sa.svg', defaultLanguage: 'ar' },
  { code: 'ES', name: 'España', flag: 'https://flagcdn.com/es.svg', defaultLanguage: 'es' },
  { code: 'FR', name: 'France', flag: 'https://flagcdn.com/fr.svg', defaultLanguage: 'fr' },
  { code: 'PT', name: 'Portugal', flag: 'https://flagcdn.com/pt.svg', defaultLanguage: 'pt-PT' },
  { code: 'JP', name: '日本', flag: 'https://flagcdn.com/jp.svg', defaultLanguage: 'ja' },
  { code: 'CN', name: '中国', flag: 'https://flagcdn.com/cn.svg', defaultLanguage: 'zh' },
];

export default function CountrySelector({ isOpen, onClose, selectedCountry, selectedLanguage, onSelect }: CountrySelectorProps) {
  const [view, setView] = useState<'country' | 'language'>('country');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {view === 'country' ? 'Selecione o país' : 'Selecione o idioma'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'country' ? 'language' : 'country')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {view === 'country' ? (
            countries.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  const newLanguage = languages.find(l => l.code === country.defaultLanguage) || selectedLanguage;
                  onSelect(country, newLanguage);
                  setView('language');
                }}
                className={`w-full flex items-center p-3 hover:bg-gray-50 rounded-lg ${
                  selectedCountry.code === country.code ? 'bg-emerald-50 text-emerald-600' : ''
                }`}
              >
                <img src={country.flag} alt={country.name} className="w-6 h-4 mr-3" />
                <span>{country.name}</span>
                {selectedCountry.code === country.code && (
                  <span className="ml-auto text-emerald-600">✓</span>
                )}
              </button>
            ))
          ) : (
            languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  onSelect(selectedCountry, language);
                  onClose();
                }}
                className={`w-full flex items-center p-3 hover:bg-gray-50 rounded-lg ${
                  selectedLanguage.code === language.code ? 'bg-emerald-50 text-emerald-600' : ''
                }`}
              >
                <img src={language.flag} alt={language.name} className="w-6 h-4 mr-3" />
                <span>{language.name}</span>
                {selectedLanguage.code === language.code && (
                  <span className="ml-auto text-emerald-600">✓</span>
                )}
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}