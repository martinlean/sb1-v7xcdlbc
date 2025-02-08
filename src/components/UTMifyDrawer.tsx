import React, { useState, useEffect } from 'react';
import { X, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UTMifyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UTMifySettings {
  enabled: boolean;
  api_token: string;
  track_methods: {
    credit_card: boolean;
    pix: boolean;
    boleto: boolean;
  };
  track_statuses: {
    checkout_abandon: boolean;
    paid: boolean;
    refunded: boolean;
    waiting_payment: boolean;
    rejected: boolean;
    chargeback: boolean;
    dispute: boolean;
    blocked: boolean;
    pre_chargeback: boolean;
  };
}

const defaultSettings: UTMifySettings = {
  enabled: false,
  api_token: '',
  track_methods: {
    credit_card: true,
    pix: true,
    boleto: true
  },
  track_statuses: {
    checkout_abandon: true,
    paid: true,
    refunded: true,
    waiting_payment: true,
    rejected: true,
    chargeback: true,
    dispute: true,
    blocked: true,
    pre_chargeback: true
  }
};

export default function UTMifyDrawer({ isOpen, onClose }: UTMifyDrawerProps) {
  const [settings, setSettings] = useState<UTMifySettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('seller_profiles')
        .select('utmify_settings')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.utmify_settings) {
        setSettings(data.utmify_settings);
      }
    } catch (err) {
      console.error('Error loading UTMify settings:', err);
      setError(err instanceof Error ? err.message : 'Error loading settings');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate API token if enabled
      if (settings.enabled && !settings.api_token) {
        throw new Error('API Token is required when UTMify is enabled');
      }

      const { error: updateError } = await supabase
        .from('seller_profiles')
        .update({
          utmify_settings: settings
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onClose();
    } catch (err) {
      console.error('Error saving UTMify settings:', err);
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-96 bg-gray-900 shadow-xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">UTMify</h2>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* API Token */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token de API
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.api_token}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      api_token: e.target.value
                    }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                    placeholder="KcKq********************FvfpnEtgTkYx"
                  />
                  <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Métodos de Pagamento
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.track_methods.credit_card}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        track_methods: {
                          ...prev.track_methods,
                          credit_card: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                    />
                    <span className="text-sm text-gray-300">Cartão de Crédito</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.track_methods.pix}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        track_methods: {
                          ...prev.track_methods,
                          pix: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                    />
                    <span className="text-sm text-gray-300">PIX</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.track_methods.boleto}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        track_methods: {
                          ...prev.track_methods,
                          boleto: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                    />
                    <span className="text-sm text-gray-300">Boleto</span>
                  </label>
                </div>
              </div>

              {/* Payment Statuses */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Status do Pagamento
                </h3>
                <div className="space-y-2">
                  {Object.entries(settings.track_statuses).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          track_statuses: {
                            ...prev.track_statuses,
                            [key]: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                      />
                      <span className="text-sm text-gray-300">
                        {key === 'checkout_abandon' && 'Abandono de Checkout'}
                        {key === 'paid' && 'Pago'}
                        {key === 'refunded' && 'Reembolsado'}
                        {key === 'waiting_payment' && 'Aguardando Pagamento'}
                        {key === 'rejected' && 'Recusado'}
                        {key === 'chargeback' && 'Chargeback'}
                        {key === 'dispute' && 'Em Disputa'}
                        {key === 'blocked' && 'Barrado pelo antifraude'}
                        {key === 'pre_chargeback' && 'Pré Chargeback'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status da integração */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                  />
                  <span className="text-sm text-gray-300">Status da integração</span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#A1D04B] text-black py-2 rounded-lg font-medium hover:bg-[#8FB842] disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'SALVAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}