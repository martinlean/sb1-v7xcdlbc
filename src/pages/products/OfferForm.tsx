import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CurrencySelector from '../../components/CurrencySelector';
import LoadingSpinner from '../../components/LoadingSpinner';

interface OfferFormData {
  name: string;
  internal_name: string;
  price: number;
  currency: string;
  language: string;
  billing_type: 'one_time' | 'recurring';
  billing_cycle?: number;
  billing_cycle_unit?: 'days' | 'months' | 'years';
  trial_days?: number;
  active: boolean;
  product_id?: string;
  metadata?: Record<string, any>;
}

const defaultProductData: OfferFormData = {
  name: '',
  internal_name: '',
  price: 0,
  currency: 'BRL',
  language: 'pt-BR',
  billing_type: 'one_time',
  active: false,
  metadata: {
    browser_language: navigator.language,
    country_code: null
  }
};

export default function OfferForm() {
  const navigate = useNavigate();
  const { id, productId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(defaultProductData);

  useEffect(() => {
    // Set product ID from URL params
    if (productId) {
      setFormData(prev => ({ 
        ...prev, 
        product_id: productId,
        metadata: {
          ...prev.metadata,
          browser_language: navigator.language
        }
      }));
    }

    // Load offer data if editing
    if (id) {
      loadOffer();
    } else {
      setLoading(false);
    }
  }, [id, productId]);

  const loadOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          internal_name: data.internal_name,
          price: data.price,
          currency: data.currency,
          language: data.language,
          billing_type: data.billing_type,
          billing_cycle: data.billing_cycle,
          billing_cycle_unit: data.billing_cycle_unit,
          trial_days: data.trial_days,
          active: data.active,
          product_id: data.product_id,
          metadata: {
            ...data.metadata,
            browser_language: navigator.language
          }
        });
      }
    } catch (err) {
      console.error('Error loading offer:', err);
      setError(err instanceof Error ? err.message : 'Error loading offer');
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
      if (!formData.name || !formData.internal_name || !formData.product_id) {
        throw new Error('Please fill in all required fields');
      }

      // Validate price
      if (formData.price <= 0) {
        throw new Error('Price must be greater than zero');
      }

      if (id) {
        // Update existing offer
        const { error: updateError } = await supabase
          .from('offers')
          .update(formData)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        // Create new offer
        const { error: insertError } = await supabase
          .from('offers')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      navigate(`/products/${productId}/settings`);
    } catch (err) {
      console.error('Error saving offer:', err);
      setError(err instanceof Error ? err.message : 'Error saving offer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!productId) {
    navigate('/products');
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate(`/products/${productId}/settings`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to product settings
        </button>
        <h1 className="text-2xl font-bold text-white">
          {id ? 'Edit Offer' : 'New Offer'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-6">
          <div className="space-y-4">
            {/* Name fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Offer name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                placeholder="Public offer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Internal name *
              </label>
              <input
                type="text"
                value={formData.internal_name}
                onChange={(e) => setFormData(prev => ({ ...prev, internal_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                placeholder="Internal identification name"
                required
              />
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Price *
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
                  Currency *
                </label>
                <CurrencySelector
                  value={formData.currency}
                  onChange={(currency) => {
                    setFormData(prev => ({
                      ...prev,
                      currency: currency.code
                    }));
                  }}
                />
              </div>
            </div>

            {/* Billing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Billing type *
              </label>
              <select
                value={formData.billing_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  billing_type: e.target.value as 'one_time' | 'recurring'
                }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                required
              >
                <option value="one_time">One-time payment</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>

            {/* Recurring billing options */}
            {formData.billing_type === 'recurring' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Billing cycle
                    </label>
                    <input
                      type="number"
                      value={formData.billing_cycle}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_cycle: parseInt(e.target.value)
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Cycle unit
                    </label>
                    <select
                      value={formData.billing_cycle_unit}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_cycle_unit: e.target.value as 'days' | 'months' | 'years'
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Trial days
                  </label>
                  <input
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      trial_days: parseInt(e.target.value)
                    }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {/* Active status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-blue-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="active" className="text-sm text-gray-300">
                Active offer
              </label>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(`/products/${productId}/settings`)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}