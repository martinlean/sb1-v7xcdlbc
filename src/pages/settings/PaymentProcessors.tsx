import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProcessorConfig {
  processor: 'stripe' | 'mercadopago';
  is_active: boolean;
  config: {
    public_key?: string;
    secret_key?: string;
    access_token?: string;
    webhook_url?: string;
  };
  webhook_secret?: string;
}

export default function PaymentProcessors() {
  const [configs, setConfigs] = useState<ProcessorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('payment_processor_configs')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Ensure we have both processors
      const existingConfigs = data || [];
      const defaultConfigs: ProcessorConfig[] = [
        {
          processor: 'stripe',
          is_active: false,
          config: {},
        },
        {
          processor: 'mercadopago',
          is_active: false,
          config: {},
        }
      ];

      const mergedConfigs = defaultConfigs.map(defaultConfig => {
        const existingConfig = existingConfigs.find(c => c.processor === defaultConfig.processor);
        return existingConfig || defaultConfig;
      });

      setConfigs(mergedConfigs);
    } catch (err) {
      console.error('Error loading configs:', err);
      setError(err instanceof Error ? err.message : 'Error loading configs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate required fields
      for (const config of configs) {
        if (config.is_active) {
          if (config.processor === 'stripe') {
            if (!config.config.public_key || !config.config.secret_key) {
              throw new Error('Stripe requires both public and secret keys');
            }
          } else if (config.processor === 'mercadopago') {
            if (!config.config.access_token) {
              throw new Error('MercadoPago requires an access token');
            }
          }
        }
      }

      // Update configs
      const { error: upsertError } = await supabase
        .from('payment_processor_configs')
        .upsert(
          configs.map(config => ({
            user_id: user.id,
            ...config
          }))
        );

      if (upsertError) throw upsertError;

    } catch (err) {
      console.error('Error saving configs:', err);
      setError(err instanceof Error ? err.message : 'Error saving configs');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Configuration */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-white">Stripe</h3>
            <p className="text-sm text-gray-400">
              Configure Stripe para aceitar pagamentos internacionais
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={configs.find(c => c.processor === 'stripe')?.is_active}
              onChange={(e) => setConfigs(prev => prev.map(c => 
                c.processor === 'stripe' 
                  ? { ...c, is_active: e.target.checked }
                  : c
              ))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {configs.find(c => c.processor === 'stripe')?.is_active && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Public Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={configs.find(c => c.processor === 'stripe')?.config.public_key || ''}
                  onChange={(e) => setConfigs(prev => prev.map(c => 
                    c.processor === 'stripe'
                      ? { ...c, config: { ...c.config, public_key: e.target.value } }
                      : c
                  ))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                  placeholder="pk_live_..."
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Secret Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={configs.find(c => c.processor === 'stripe')?.config.secret_key || ''}
                  onChange={(e) => setConfigs(prev => prev.map(c => 
                    c.processor === 'stripe'
                      ? { ...c, config: { ...c.config, secret_key: e.target.value } }
                      : c
                  ))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                  placeholder="sk_live_..."
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Webhook Secret
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={configs.find(c => c.processor === 'stripe')?.webhook_secret || ''}
                  onChange={(e) => setConfigs(prev => prev.map(c => 
                    c.processor === 'stripe'
                      ? { ...c, webhook_secret: e.target.value }
                      : c
                  ))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                  placeholder="whsec_..."
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MercadoPago Configuration */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-white">MercadoPago</h3>
            <p className="text-sm text-gray-400">
              Configure MercadoPago para aceitar PIX e pagamentos locais
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={configs.find(c => c.processor === 'mercadopago')?.is_active}
              onChange={(e) => setConfigs(prev => prev.map(c => 
                c.processor === 'mercadopago' 
                  ? { ...c, is_active: e.target.checked }
                  : c
              ))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {configs.find(c => c.processor === 'mercadopago')?.is_active && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Access Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={configs.find(c => c.processor === 'mercadopago')?.config.access_token || ''}
                  onChange={(e) => setConfigs(prev => prev.map(c => 
                    c.processor === 'mercadopago'
                      ? { ...c, config: { ...c.config, access_token: e.target.value } }
                      : c
                  ))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                  placeholder="APP_USR-..."
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Webhook Secret
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={configs.find(c => c.processor === 'mercadopago')?.webhook_secret || ''}
                  onChange={(e) => setConfigs(prev => prev.map(c => 
                    c.processor === 'mercadopago'
                      ? { ...c, webhook_secret: e.target.value }
                      : c
                  ))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                  placeholder="Webhook secret..."
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Save Button */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}