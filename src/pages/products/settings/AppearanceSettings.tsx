import React, { useState, useEffect } from 'react';
import { Save, Upload, Palette, Layout } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ImageUpload from '../../../components/ImageUpload';

interface AppearanceSettingsProps {
  productId: string;
  onSave: () => void;
}

interface AppearanceSettings {
  logo?: string;
  favicon?: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    buttonText: string;
  };
  layout: {
    style: 'default' | 'minimal' | 'modern';
    showHeader: boolean;
    showFooter: boolean;
    showTestimonials: boolean;
    showGuarantee: boolean;
    showSecurityBadges: boolean;
  };
  customCSS?: string;
  customJS?: string;
}

const defaultSettings: AppearanceSettings = {
  colors: {
    primary: '#00A3FF',
    secondary: '#0044FF',
    background: '#ffffff',
    text: '#1a1a1a',
    buttonText: '#ffffff'
  },
  layout: {
    style: 'default',
    showHeader: true,
    showFooter: true,
    showTestimonials: true,
    showGuarantee: true,
    showSecurityBadges: true
  }
};

export default function AppearanceSettings({ productId, onSave }: AppearanceSettingsProps) {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [productId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('custom_checkout_theme')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data?.custom_checkout_theme) {
        // Merge with default settings to ensure all properties exist
        setSettings({
          ...defaultSettings,
          ...data.custom_checkout_theme
        });
      }
    } catch (err) {
      console.error('Error loading appearance settings:', err);
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
          custom_checkout_theme: settings,
          custom_checkout_enabled: true
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      onSave();
    } catch (err) {
      console.error('Error saving appearance settings:', err);
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Branding */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Identidade Visual</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Logo
            </label>
            <ImageUpload
              currentImage={settings.logo}
              onImageChange={(url) => setSettings(prev => ({ ...prev, logo: url }))}
              onError={setError}
              userId={productId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Favicon
            </label>
            <ImageUpload
              currentImage={settings.favicon}
              onImageChange={(url) => setSettings(prev => ({ ...prev, favicon: url }))}
              onError={setError}
              userId={productId}
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Cores
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cor primária
            </label>
            <input
              type="color"
              value={settings.colors.primary}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                colors: { ...prev.colors, primary: e.target.value }
              }))}
              className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cor secundária
            </label>
            <input
              type="color"
              value={settings.colors.secondary}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                colors: { ...prev.colors, secondary: e.target.value }
              }))}
              className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cor de fundo
            </label>
            <input
              type="color"
              value={settings.colors.background}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                colors: { ...prev.colors, background: e.target.value }
              }))}
              className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cor do texto
            </label>
            <input
              type="color"
              value={settings.colors.text}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                colors: { ...prev.colors, text: e.target.value }
              }))}
              className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cor do texto dos botões
            </label>
            <input
              type="color"
              value={settings.colors.buttonText}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                colors: { ...prev.colors, buttonText: e.target.value }
              }))}
              className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Layout
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estilo do layout
            </label>
            <select
              value={settings.layout.style}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                layout: { ...prev.layout, style: e.target.value as AppearanceSettings['layout']['style'] }
              }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
            >
              <option value="default">Padrão</option>
              <option value="minimal">Minimalista</option>
              <option value="modern">Moderno</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showHeader"
                checked={settings.layout.showHeader}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  layout: { ...prev.layout, showHeader: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="showHeader" className="text-sm text-gray-300">
                Mostrar cabeçalho
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showFooter"
                checked={settings.layout.showFooter}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  layout: { ...prev.layout, showFooter: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="showFooter" className="text-sm text-gray-300">
                Mostrar rodapé
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showTestimonials"
                checked={settings.layout.showTestimonials}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  layout: { ...prev.layout, showTestimonials: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="showTestimonials" className="text-sm text-gray-300">
                Mostrar depoimentos
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showGuarantee"
                checked={settings.layout.showGuarantee}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  layout: { ...prev.layout, showGuarantee: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="showGuarantee" className="text-sm text-gray-300">
                Mostrar garantia
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showSecurityBadges"
                checked={settings.layout.showSecurityBadges}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  layout: { ...prev.layout, showSecurityBadges: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="showSecurityBadges" className="text-sm text-gray-300">
                Mostrar selos de segurança
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Code */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Código Personalizado</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CSS Personalizado
            </label>
            <textarea
              value={settings.customCSS}
              onChange={(e) => setSettings(prev => ({ ...prev, customCSS: e.target.value }))}
              className="w-full h-32 bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 font-mono text-sm"
              placeholder="/* Adicione seu CSS personalizado aqui */"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              JavaScript Personalizado
            </label>
            <textarea
              value={settings.customJS}
              onChange={(e) => setSettings(prev => ({ ...prev, customJS: e.target.value }))}
              className="w-full h-32 bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 font-mono text-sm"
              placeholder="// Adicione seu JavaScript personalizado aqui"
            />
          </div>
        </div>
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
    </div>
  );
}