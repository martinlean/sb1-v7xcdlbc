import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, Eye, AlertCircle, Link2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface UpsellOffer {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number;
  image: string;
  active: boolean;
  type: 'upsell' | 'downsell';
  position: number;
}

interface UpsellSettings {
  enabled: boolean;
  success_url?: string;
  offers: UpsellOffer[];
}

interface UpsellSettingsProps {
  productId: string;
  onSave: () => void;
}

export default function UpsellSettings({ productId, onSave }: UpsellSettingsProps) {
  const [settings, setSettings] = useState<UpsellSettings>({
    enabled: false,
    offers: []
  });
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [offerType, setOfferType] = useState<'upsell' | 'downsell'>('upsell');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [productId]);

  const loadSettings = async () => {
    try {
      const { data, error: settingsError } = await supabase
        .from('products')
        .select('upsell_settings')
        .eq('id', productId)
        .single();

      if (settingsError) throw settingsError;
      
      if (data?.upsell_settings) {
        setSettings(data.upsell_settings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          upsell_settings: settings
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      onSave();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOffer = async () => {
    try {
      if (!selectedProduct) {
        throw new Error('Please select a product');
      }

      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', selectedProduct)
        .single();

      if (productError) throw productError;

      const newOffer: UpsellOffer = {
        id: crypto.randomUUID(),
        title: product.name,
        description: product.description,
        price: customPrice || product.price,
        original_price: product.price,
        image: product.image,
        type: offerType,
        active: true,
        position: settings.offers.length
      };

      setSettings(prev => ({
        ...prev,
        enabled: true,
        offers: [...prev.offers, newOffer]
      }));

      setIsAddingOffer(false);
      setSelectedProduct('');
      setCustomPrice(0);
      await handleSave();
    } catch (err) {
      console.error('Error adding offer:', err);
      setError(err instanceof Error ? err.message : 'Error adding offer');
    }
  };

  return (
    <div className="space-y-8">
      {/* Enable Upsell */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Upsell/Downsell</h3>
          <p className="text-sm text-gray-400">
            Configure ofertas adicionais que serão exibidas após a compra
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
          {/* Success URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL de redirecionamento após a compra
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={settings.success_url || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    success_url: e.target.value
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-10"
                  placeholder="https://seu-site.com/obrigado"
                />
                <Link2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Se não informada, o comprador permanecerá na página de sucesso padrão
            </p>
          </div>

          {/* Add Offer Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddingOffer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Adicionar Oferta
            </button>
          </div>

          {/* Offers List */}
          <div className="space-y-4">
            {settings.offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium">{offer.title}</h4>
                        <p className="text-sm text-gray-400">{offer.description}</p>
                        <span className="inline-block px-2 py-1 text-xs rounded-full mt-2 bg-blue-500/10 text-blue-500">
                          {offer.type === 'upsell' ? 'Upsell' : 'Downsell'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              offers: prev.offers.map(o => 
                                o.id === offer.id ? { ...o, active: !o.active } : o
                              )
                            }));
                            handleSave();
                          }}
                          className={`p-1 rounded-lg ${
                            offer.active
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                          title={offer.active ? 'Desativar' : 'Ativar'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              offers: prev.offers.filter(o => o.id !== offer.id)
                            }));
                            handleSave();
                          }}
                          className="p-1 hover:bg-red-500/10 text-red-500 rounded-lg"
                          title="Remover"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-400 line-through">
                        R$ {offer.original_price.toFixed(2)}
                      </span>
                      <span className="text-sm font-medium text-green-500">
                        R$ {offer.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Offer Modal */}
      {isAddingOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Adicionar Oferta
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tipo de oferta *
                  </label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as 'upsell' | 'downsell')}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                  >
                    <option value="upsell">Upsell</option>
                    <option value="downsell">Downsell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Produto *
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                  >
                    <option value="">Selecione um produto</option>
                    {/* Add product options here */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Preço promocional
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customPrice || ''}
                      onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 pl-8"
                      placeholder="Deixe em branco para usar o preço original"
                      min="0"
                      step="0.01"
                    />
                    <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-800 px-6 py-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddingOffer(false);
                  setSelectedProduct('');
                  setCustomPrice(0);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOffer}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}