import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../../components/ImageUpload';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image: string;
  active: boolean;
  membership_type: 'none' | 'course' | 'subscription' | 'community';
  membership_platform?: string;
  membership_url?: string;
  membership_webhook?: string;
  affiliate_commission: number;
  affiliate_cookie_days: number;
  affiliate_enabled: boolean;
  coproduction_enabled: boolean;
  coproduction_split: number;
  billing_name?: string;
  support_email?: string;
}

const defaultProductData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  image: '',
  active: false,
  membership_type: 'none',
  affiliate_commission: 30,
  affiliate_cookie_days: 30,
  affiliate_enabled: false,
  coproduction_enabled: false,
  coproduction_split: 0
};

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultProductData);

  useEffect(() => {
    if (id) {
      loadProduct();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          description: data.description,
          price: data.price,
          image: data.image,
          active: data.active,
          membership_type: data.membership_type || 'none',
          membership_platform: data.membership_platform,
          membership_url: data.membership_url,
          membership_webhook: data.membership_webhook,
          affiliate_commission: data.affiliate_commission || 30,
          affiliate_cookie_days: data.affiliate_cookie_days || 30,
          affiliate_enabled: data.affiliate_enabled || false,
          coproduction_enabled: data.coproduction_enabled || false,
          coproduction_split: data.coproduction_split || 0,
          billing_name: data.billing_name,
          support_email: data.support_email
        });
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError(err instanceof Error ? err.message : 'Error loading product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!formData.name || !formData.description || !formData.image) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      // Validate description length
      if (formData.description.length < 100) {
        throw new Error('A descrição deve ter no mínimo 100 caracteres');
      }

      // Validate price
      if (formData.price <= 0) {
        throw new Error('O preço deve ser maior que zero');
      }

      const productData = {
        ...formData,
        billing_name: formData.billing_name || formData.name,
        support_email: formData.support_email || 'suporte@rewardsmidia.online'
      };

      if (id) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);

        if (insertError) throw insertError;
      }

      navigate('/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para produtos
        </button>
        <h1 className="text-2xl font-bold text-white">
          {id ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome do produto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                placeholder="Digite o nome do produto"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                placeholder="Digite a descrição do produto"
                rows={4}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                A descrição deve ter no mínimo 100 caracteres. Atualmente: {formData.description.length} caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preço *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tipo de produto *
              </label>
              <select
                value={formData.membership_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  membership_type: e.target.value as ProductFormData['membership_type']
                }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                required
              >
                <option value="none">Produto digital</option>
                <option value="course">Curso</option>
                <option value="subscription">Assinatura</option>
                <option value="community">Comunidade</option>
              </select>
            </div>

            {formData.membership_type !== 'none' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Plataforma
                  </label>
                  <input
                    type="text"
                    value={formData.membership_platform || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, membership_platform: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                    placeholder="Ex: Hotmart, Kiwify, etc"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    URL de acesso
                  </label>
                  <input
                    type="url"
                    value={formData.membership_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, membership_url: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Webhook
                  </label>
                  <input
                    type="url"
                    value={formData.membership_webhook || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, membership_webhook: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                    placeholder="https://"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Imagem do produto *
              </label>
              <ImageUpload
                currentImage={formData.image}
                onImageChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                onError={setError}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="affiliate_enabled"
                  checked={formData.affiliate_enabled}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    affiliate_enabled: e.target.checked 
                  }))}
                  className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor="affiliate_enabled" className="text-sm text-gray-300">
                  Habilitar programa de afiliados
                </label>
              </div>

              {formData.affiliate_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Comissão de afiliados (%)
                    </label>
                    <input
                      type="number"
                      value={formData.affiliate_commission}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        affiliate_commission: parseFloat(e.target.value) 
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
                      value={formData.affiliate_cookie_days}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        affiliate_cookie_days: parseInt(e.target.value) 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                      min="1"
                      max="365"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coproduction_enabled"
                  checked={formData.coproduction_enabled}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    coproduction_enabled: e.target.checked 
                  }))}
                  className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor="coproduction_enabled" className="text-sm text-gray-300">
                  Habilitar co-produção
                </label>
              </div>

              {formData.coproduction_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Divisão de receita (%)
                  </label>
                  <input
                    type="number"
                    value={formData.coproduction_split}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      coproduction_split: parseFloat(e.target.value) 
                    }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="active" className="text-sm text-gray-300">
                Produto ativo
              </label>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}