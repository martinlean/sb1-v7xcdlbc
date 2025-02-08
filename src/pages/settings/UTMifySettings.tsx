import React, { useState, useEffect } from 'react';
import { Save, Link2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UTMifySettings {
  enabled: boolean;
  webhook_url: string;
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
  webhook_url: '',
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

export default function UTMifySettings() {
  const [settings, setSettings] = useState<UTMifySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

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

      // Validate webhook URL if enabled
      if (settings.enabled && !settings.webhook_url) {
        throw new Error('Webhook URL is required when UTMify is enabled');
      }

      const { error: updateError } = await supabase
        .from('seller_profiles')
        .update({
          utmify_settings: settings
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

    } catch (err) {
      console.error('Error saving UTMify settings:', err);
      setError(err instanceof Error ? err.message : 'Error saving settings');
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
      {/* Enable UTMify */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">UTMify Integration</h3>
          <p className="text-sm text-gray-400">
            Track your sales and marketing campaigns with UTMify
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Webhook URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={settings.webhook_url}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  webhook_url: e.target.value
                }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                placeholder="https://api.utmify.com/webhooks/your-id"
              />
              <Link2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Track Payment Methods
            </h4>
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
                <span className="text-sm text-gray-300">Credit Card</span>
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
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Track Payment Statuses
            </h4>
            <div className="grid grid-cols-2 gap-2">
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
                    {key.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

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