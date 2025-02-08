-- First remove existing constraints
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_currency;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS valid_language;

-- Update existing records to use new format
UPDATE offers 
SET 
  language = CASE 
    WHEN language IN ('en', 'en-US', 'en-GB') THEN 'en-US'
    WHEN language IN ('pt-BR', 'pt') THEN 'pt-BR'
    WHEN language IN ('es', 'es-ES', 'es-MX') THEN 'es-ES'
    WHEN language IN ('fr', 'fr-FR') THEN 'fr-FR'
    WHEN language IN ('de', 'de-DE') THEN 'de-DE'
    WHEN language IN ('it', 'it-IT') THEN 'it-IT'
    WHEN language IN ('ja', 'ja-JP') THEN 'ja-JP'
    WHEN language IN ('zh', 'zh-CN') THEN 'zh-CN'
    WHEN language IN ('ar', 'ar-SA') THEN 'ar-SA'
    ELSE 'en-US'
  END,
  currency = UPPER(TRIM(currency));

-- Add new currency constraint with all supported currencies
ALTER TABLE offers ADD CONSTRAINT valid_currency CHECK (
  UPPER(TRIM(currency)) IN (
    'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
    'BAM', 'BBD', 'BDT', 'BGN', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD',
    'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC',
    'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ETB', 'EUR', 'FJD',
    'FKP', 'GBP', 'GEL', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL',
    'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JMD', 'JPY', 'KES',
    'KGS', 'KHR', 'KMF', 'KRW', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD',
    'LSL', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MUR', 'MVR',
    'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD',
    'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD',
    'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS',
    'SRD', 'STD', 'SZL', 'THB', 'TJS', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS',
    'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VND', 'VUV', 'WST', 'XAF', 'XCD',
    'XOF', 'XPF', 'YER', 'ZAR', 'ZMW'
  )
);

-- Add language constraint matching currency countries
ALTER TABLE offers ADD CONSTRAINT valid_language CHECK (
  language IN (
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ', 'en-IE', 'en-ZA', 'en-IN',
    'pt-BR', 'pt-PT',
    'es-ES', 'es-MX', 'es-AR', 'es-CL', 'es-CO', 'es-PE',
    'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH',
    'de-DE', 'de-AT', 'de-CH',
    'it-IT', 'ja-JP', 'zh-CN', 'zh-TW',
    'ar-AE', 'ar-SA', 'ar-EG',
    'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
    'ko-KR', 'ru-RU', 'pl-PL', 'tr-TR',
    'hi-IN', 'bn-IN', 'fil-PH'
  )
);

-- Add helpful comments
COMMENT ON CONSTRAINT valid_currency ON offers IS 'All supported payment processing currencies';
COMMENT ON CONSTRAINT valid_language ON offers IS 'Supported languages matching currency countries';