import React, { useState, useEffect } from 'react';
import { IMaskInput } from 'react-imask';
import { ChevronDown, Search } from 'lucide-react';
import { Country, countries, getCountryByCode, getPhoneFormat, getDefaultCountry } from '../config/countries';
import { useGeoLocation } from '../hooks/useGeoLocation';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function PhoneInput({
  value,
  onChange,
  className = '',
  required = false,
  disabled = false,
  placeholder
}: PhoneInputProps) {
  const { country: detectedCountry } = useGeoLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    getDefaultCountry(navigator.language, detectedCountry)
  );

  // Update selected country when location is detected
  useEffect(() => {
    if (detectedCountry) {
      const country = getCountryByCode(detectedCountry);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [detectedCountry]);

  // Filter countries based on search
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.phoneCode.includes(searchTerm)
  );

  // Group countries by region
  const groupedCountries = {
    americas: filteredCountries.filter(c => ['BR', 'US', 'CA', 'MX', 'AR'].includes(c.code)),
    europe: filteredCountries.filter(c => ['ES', 'GB', 'FR', 'DE', 'IT'].includes(c.code)),
    asia: filteredCountries.filter(c => ['JP', 'CN'].includes(c.code))
  };

  return (
    <div className="relative">
      <div className="flex">
        {/* Country selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-l-lg hover:bg-gray-100"
          >
            <img
              src={selectedCountry.flag}
              alt={selectedCountry.name}
              className="w-5 h-3.5 object-cover"
            />
            <span className="text-gray-700">+{selectedCountry.phoneCode}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Country dropdown */}
          {isOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 w-72 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg">
              {/* Search input */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md"
                    placeholder="Search country or code..."
                  />
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Countries list */}
              <div className="overflow-y-auto max-h-72">
                {/* Americas */}
                {groupedCountries.americas.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                      Americas
                    </div>
                    {groupedCountries.americas.map((country) => (
                      <CountryOption
                        key={country.code}
                        country={country}
                        selected={selectedCountry.code === country.code}
                        onSelect={() => {
                          setSelectedCountry(country);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Europe */}
                {groupedCountries.europe.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                      Europe
                    </div>
                    {groupedCountries.europe.map((country) => (
                      <CountryOption
                        key={country.code}
                        country={country}
                        selected={selectedCountry.code === country.code}
                        onSelect={() => {
                          setSelectedCountry(country);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Asia */}
                {groupedCountries.asia.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                      Asia
                    </div>
                    {groupedCountries.asia.map((country) => (
                      <CountryOption
                        key={country.code}
                        country={country}
                        selected={selectedCountry.code === country.code}
                        onSelect={() => {
                          setSelectedCountry(country);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                      />
                    ))}
                  </>
                )}

                {filteredCountries.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone number input */}
        <IMaskInput
          mask={getPhoneFormat(selectedCountry.code)}
          value={value}
          onAccept={(value) => onChange(`+${selectedCountry.phoneCode}${value}`)}
          className={`flex-1 rounded-r-lg ${className}`}
          placeholder={placeholder || selectedCountry.format}
          required={required}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

interface CountryOptionProps {
  country: Country;
  selected: boolean;
  onSelect: () => void;
}

function CountryOption({ country, selected, onSelect }: CountryOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 ${
        selected ? 'bg-blue-50' : ''
      }`}
    >
      <img
        src={country.flag}
        alt={country.name}
        className="w-5 h-3.5 object-cover"
      />
      <span className="flex-1 text-left text-sm">{country.name}</span>
      <span className="text-sm text-gray-500">+{country.phoneCode}</span>
    </button>
  );
}