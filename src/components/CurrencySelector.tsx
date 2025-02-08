import React, { useState } from 'react';
import { currencies, Currency } from '../config/currencies';
import { Globe, Search } from 'lucide-react';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: Currency) => void;
  className?: string;
}

export default function CurrencySelector({ value, onChange, className = '' }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const selectedCurrency = currencies.find(c => c.code === value.toUpperCase());

  const filteredCurrencies = currencies.filter(currency => 
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group currencies by region
  const groupedCurrencies = {
    major: filteredCurrencies.filter(c => ['USD', 'EUR', 'GBP', 'BRL', 'AUD', 'CAD', 'JPY'].includes(c.code)),
    other: filteredCurrencies.filter(c => !['USD', 'EUR', 'GBP', 'BRL', 'AUD', 'CAD', 'JPY'].includes(c.code))
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center gap-2">
          {selectedCurrency && (
            <img 
              src={selectedCurrency.flag} 
              alt={selectedCurrency.code}
              className="w-5 h-3.5 object-cover rounded"
            />
          )}
          <span>
            {selectedCurrency 
              ? `${selectedCurrency.code} - ${selectedCurrency.name}`
              : 'Select currency'
            }
          </span>
        </div>
        <Globe className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search currency..."
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {/* Major Currencies */}
            {groupedCurrencies.major.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-800/50">
                  Major Currencies
                </div>
                {groupedCurrencies.major.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      onChange(currency);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 ${
                      currency.code === value ? 'bg-blue-500/10 text-blue-500' : 'text-white'
                    }`}
                  >
                    <img 
                      src={currency.flag} 
                      alt={currency.code}
                      className="w-5 h-3.5 object-cover rounded"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-400">{currency.name}</div>
                    </div>
                    <div className="text-lg font-medium">{currency.symbol}</div>
                  </button>
                ))}
              </>
            )}

            {/* Other Currencies */}
            {groupedCurrencies.other.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-800/50">
                  Other Currencies
                </div>
                {groupedCurrencies.other.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      onChange(currency);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 ${
                      currency.code === value ? 'bg-blue-500/10 text-blue-500' : 'text-white'
                    }`}
                  >
                    <img 
                      src={currency.flag} 
                      alt={currency.code}
                      className="w-5 h-3.5 object-cover rounded"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-400">{currency.name}</div>
                    </div>
                    <div className="text-lg font-medium">{currency.symbol}</div>
                  </button>
                ))}
              </>
            )}

            {filteredCurrencies.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                No currencies found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}