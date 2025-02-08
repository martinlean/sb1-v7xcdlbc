import React, { useState } from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  {
    code: 'pt-BR',
    name: 'Português (Brasil)',
    flag: 'https://flagcdn.com/br.svg'
  },
  {
    code: 'es-ES',
    name: 'Español',
    flag: 'https://flagcdn.com/es.svg'
  },
  {
    code: 'en-US',
    name: 'English',
    flag: 'https://flagcdn.com/us.svg'
  }
];

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <img
          src={currentLang.flag}
          alt={currentLang.name}
          className="w-4 h-3 object-cover rounded"
        />
        <span className="hidden sm:inline">{currentLang.name}</span>
        <Globe className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onLanguageChange(language.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 ${
                currentLanguage === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <img
                src={language.flag}
                alt={language.name}
                className="w-4 h-3 object-cover rounded"
              />
              <span>{language.name}</span>
              {currentLanguage === language.code && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}