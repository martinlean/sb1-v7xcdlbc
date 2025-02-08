import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface PaymentSettingsProps {
  productId: string;
  onSave: () => void;
}

interface PaymentSettings {
  processor: 'stripe' | 'mercadopago';
  acceptPaymentsVia: 'cpf' | 'cnpj' | 'both';
  paymentMethods: {
    creditCard: boolean;
    pix: boolean;
  };
  discounts: {
    creditCard: number;
    pix: number;
  };
  creditCard: {
    maxInstallments: number;
    defaultInstallment: number;
  };
  pix: {
    expirationMinutes: number;
  };
}

export default function PaymentSettings({ productId, onSave }: PaymentSettingsProps) {
  const [settings, setSettings] = useState<PaymentSettings>({
    processor: 'stripe',
    acceptPaymentsVia: 'cpf',
    paymentMethods: {
      creditCard: true,
      pix: false
    },
    discounts: {
      creditCard: 0,
      pix: 0
    },
    creditCard: {
      maxInstallments: 12,
      defaultInstallment: 1
    },
    pix: {
      expirationMinutes: 15
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [productId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('payment_settings')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data?.payment_settings) {
        setSettings(data.payment_settings);
      }
    } catch (err) {
      console.error('Error loading payment settings:', err);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('products')
        .update({
          payment_settings: settings
        })
        .eq('id', productId);

      if (error) throw error;

      onSave();
    } catch (error) {
      console.error('Error saving payment settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Processor */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Processador de pagamento *
        </label>
        <select
          value={settings.processor}
          onChange={(e) => {
            const processor = e.target.value as 'stripe' | 'mercadopago';
            setSettings(prev => ({
              ...prev,
              processor,
              paymentMethods: {
                creditCard: processor === 'stripe',
                pix: processor === 'mercadopago'
              }
            }));
          }}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
        >
          <option value="stripe">Stripe (Cartão de Crédito)</option>
          <option value="mercadopago">MercadoPago (PIX)</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {settings.processor === 'stripe' 
            ? 'Checkout em checkout.rewardsmidia.online'
            : 'Checkout em pay.rewardsmidia.online'}
        </p>
      </div>

      {/* Document Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Aceitar pagamentos via *
        </label>
        <select
          value={settings.acceptPaymentsVia}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            acceptPaymentsVia: e.target.value as PaymentSettings['acceptPaymentsVia']
          }))}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
        >
          <option value="cpf">CPF</option>
          <option value="cnpj">CNPJ</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      {/* Stripe Settings */}
      {settings.processor === 'stripe' && (
        <>
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Cartão de Crédito</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Limite de parcelas
                </label>
                <select
                  value={settings.creditCard.maxInstallments}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    creditCard: {
                      ...prev.creditCard,
                      maxInstallments: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Parcela pré-selecionada
                </label>
                <select
                  value={settings.creditCard.defaultInstallment}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    creditCard: {
                      ...prev.creditCard,
                      defaultInstallment: parseInt(e.target.value)
                    }
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                >
                  {Array.from({ length: settings.creditCard.maxInstallments }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Desconto no cartão (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.discounts.creditCard}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  discounts: {
                    ...prev.discounts,
                    creditCard: parseFloat(e.target.value)
                  }
                }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </>
      )}

      {/* MercadoPago Settings */}
      {settings.processor === 'mercadopago' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tempo de expiração do PIX (minutos)
            </label>
            <input
              type="number"
              value={settings.pix.expirationMinutes}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                pix: {
                  ...prev.pix,
                  expirationMinutes: parseInt(e.target.value)
                }
              }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
              min="5"
              max="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Desconto no PIX (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.discounts.pix}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  discounts: {
                    ...prev.discounts,
                    pix: parseFloat(e.target.value)
                  }
                }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}