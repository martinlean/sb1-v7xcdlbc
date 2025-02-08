import React, { useState, useEffect } from 'react';
import { Save, Users, Clock, Percent, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AffiliateSettingsProps {
  productId: string;
  onSave: () => void;
}

interface AffiliateSettings {
  enabled: boolean;
  commission: number;
  cookieDays: number;
  minPayoutAmount: number;
  payoutFrequency: 'weekly' | 'biweekly' | 'monthly';
  autoApprove: boolean;
  requireApplication: boolean;
  applicationQuestions: string[];
  termsAndConditions: string;
}

const defaultSettings: AffiliateSettings = {
  enabled: false,
  commission: 30,
  cookieDays: 30,
  minPayoutAmount: 50,
  payoutFrequency: 'monthly',
  autoApprove: false,
  requireApplication: true,
  applicationQuestions: [
    'Por que você quer ser afiliado deste produto?',
    'Qual sua experiência com vendas online?',
    'Como você pretende promover o produto?'
  ],
  termsAndConditions: `1. O afiliado concorda em promover o produto de forma ética e honesta.
2. O afiliado não pode fazer promessas falsas ou enganosas sobre o produto.
3. O afiliado não pode usar spam ou práticas abusivas de marketing.
4. O afiliado deve divulgar claramente sua relação de afiliado com o produto.
5. O produtor se reserva o direito de encerrar a parceria a qualquer momento.`
};

export default function AffiliateSettings({ productId, onSave }: AffiliateSettingsProps) {
  const [settings, setSettings] = useState<AffiliateSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    loadSettings();
  }, [productId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('affiliate_enabled, affiliate_commission, affiliate_cookie_days, affiliate_settings')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          ...defaultSettings,
          enabled: data.affiliate_enabled || false,
          commission: data.affiliate_commission || 30,
          cookieDays: data.affiliate_cookie_days || 30,
          ...data.affiliate_settings
        });
      }
    } catch (err) {
      console.error('Error loading affiliate settings:', err);
      setError(err instanceof Error ? err.message : 'Error loading settings');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          affiliate_enabled: settings.enabled,
          affiliate_commission: settings.commission,
          affiliate_cookie_days: settings.cookieDays,
          affiliate_settings: {
            minPayoutAmount: settings.minPayoutAmount,
            payoutFrequency: settings.payoutFrequency,
            autoApprove: settings.autoApprove,
            requireApplication: settings.requireApplication,
            applicationQuestions: settings.applicationQuestions,
            termsAndConditions: settings.termsAndConditions
          }
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      onSave();
    } catch (err) {
      console.error('Error saving affiliate settings:', err);
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setSettings(prev => ({
        ...prev,
        applicationQuestions: [...prev.applicationQuestions, newQuestion.trim()]
      }));
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setSettings(prev => ({
      ...prev,
      applicationQuestions: prev.applicationQuestions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-8">
      {/* Enable Affiliates */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Programa de Afiliados</h3>
          <p className="text-sm text-gray-400">
            Permita que outras pessoas vendam seu produto e ganhem comissão
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
          {/* Commission Settings */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Comissão e Cookies
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Comissão por venda (%)
                </label>
                <input
                  type="number"
                  value={settings.commission}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    commission: parseFloat(e.target.value)
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Duração do cookie (dias)
                </label>
                <input
                  type="number"
                  value={settings.cookieDays}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cookieDays: parseInt(e.target.value)
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                  min="1"
                  max="365"
                />
              </div>
            </div>
          </div>

          {/* Payout Settings */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pagamentos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Valor mínimo para saque (R$)
                </label>
                <input
                  type="number"
                  value={settings.minPayoutAmount}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    minPayoutAmount: parseFloat(e.target.value)
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Frequência de pagamento
                </label>
                <select
                  value={settings.payoutFrequency}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    payoutFrequency: e.target.value as AffiliateSettings['payoutFrequency']
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Application Settings */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Processo de Aprovação
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={settings.autoApprove}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    autoApprove: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor="autoApprove" className="text-sm text-gray-300">
                  Aprovar afiliados automaticamente
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireApplication"
                  checked={settings.requireApplication}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    requireApplication: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor="requireApplication" className="text-sm text-gray-300">
                  Exigir formulário de inscrição
                </label>
              </div>

              {settings.requireApplication && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Perguntas do formulário
                  </label>
                  <div className="space-y-2">
                    {settings.applicationQuestions.map((question, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => {
                            const newQuestions = [...settings.applicationQuestions];
                            newQuestions[index] = e.target.value;
                            setSettings(prev => ({
                              ...prev,
                              applicationQuestions: newQuestions
                            }));
                          }}
                          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                        />
                        <button
                          onClick={() => removeQuestion(index)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Nova pergunta..."
                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                      />
                      <button
                        onClick={addQuestion}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Termos e Condições
            </label>
            <textarea
              value={settings.termsAndConditions}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                termsAndConditions: e.target.value
              }))}
              className="w-full h-48 bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
              placeholder="Digite os termos e condições do programa de afiliados..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              {error}
            </div>
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
        </>
      )}
    </div>
  );
}