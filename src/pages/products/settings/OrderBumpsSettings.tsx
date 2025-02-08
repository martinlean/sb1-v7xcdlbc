import React, { useState, useEffect } from 'react';
import { Save, Plus, X, DollarSign, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Product } from '../../../types';

interface OrderBumpsSettingsProps {
  productId: string;
  onSave: () => void;
}

interface OrderBump {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  active: boolean;
  position: number;
}

export default function OrderBumpsSettings({ productId, onSave }: OrderBumpsSettingsProps) {
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isAddingBump, setIsAddingBump] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderBumps();
    loadAvailableProducts();
  }, [productId]);

  const loadOrderBumps = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('order_bumps')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data?.order_bumps) {
        setOrderBumps(data.order_bumps);
      }
    } catch (err) {
      console.error('Error loading order bumps:', err);
      setError(err instanceof Error ? err.message : 'Error loading order bumps');
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .neq('id', productId);

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (err) {
      console.error('Error loading available products:', err);
    }
  };

  const handleAddBump = async () => {
    try {
      if (!selectedProduct) {
        throw new Error('Please select a product');
      }

      const product = availableProducts.find(p => p.id === selectedProduct);
      if (!product) return;

      const newBump: OrderBump = {
        id: product.id,
        title: product.name,
        description: product.description,
        price: customPrice || product.price,
        originalPrice: product.price,
        image: product.image,
        active: true,
        position: orderBumps.length
      };

      const updatedBumps = [...orderBumps, newBump];
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          order_bumps: updatedBumps,
          order_bump_enabled: true
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      setOrderBumps(updatedBumps);
      setIsAddingBump(false);
      setSelectedProduct('');
      setCustomPrice(0);
      onSave();
    } catch (err) {
      console.error('Error adding order bump:', err);
      setError(err instanceof Error ? err.message : 'Error adding order bump');
    }
  };

  const handleRemoveBump = async (bumpId: string) => {
    try {
      const updatedBumps = orderBumps.filter(bump => bump.id !== bumpId);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          order_bumps: updatedBumps,
          order_bump_enabled: updatedBumps.length > 0
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      setOrderBumps(updatedBumps);
      onSave();
    } catch (err) {
      console.error('Error removing order bump:', err);
      setError(err instanceof Error ? err.message : 'Error removing order bump');
    }
  };

  const handleToggleBump = async (bumpId: string) => {
    try {
      const updatedBumps = orderBumps.map(bump => 
        bump.id === bumpId ? { ...bump, active: !bump.active } : bump
      );
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          order_bumps: updatedBumps
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      setOrderBumps(updatedBumps);
      onSave();
    } catch (err) {
      console.error('Error toggling order bump:', err);
      setError(err instanceof Error ? err.message : 'Error toggling order bump');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">Order Bumps</h3>
          <p className="text-sm text-gray-400">
            Adicione ofertas complementares que serão exibidas durante o checkout
          </p>
        </div>
        <button
          onClick={() => setIsAddingBump(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Adicionar Order Bump
        </button>
      </div>

      {/* Order Bumps List */}
      <div className="space-y-4">
        {orderBumps.map((bump) => (
          <div
            key={bump.id}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-start gap-4">
              <img
                src={bump.image}
                alt={bump.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium">{bump.title}</h4>
                    <p className="text-sm text-gray-400">{bump.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBump(bump.id)}
                      className={`p-1 rounded-lg ${
                        bump.active
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                      title={bump.active ? 'Desativar' : 'Ativar'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveBump(bump.id)}
                      className="p-1 hover:bg-red-500/10 text-red-500 rounded-lg"
                      title="Remover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">
                    R$ {bump.originalPrice.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-green-500">
                    R$ {bump.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {orderBumps.length === 0 && !isAddingBump && (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400">
              Nenhum order bump configurado
            </p>
          </div>
        )}
      </div>

      {/* Add Order Bump Modal */}
      {isAddingBump && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Adicionar Order Bump
              </h3>
              
              <div className="space-y-4">
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
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
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
                  setIsAddingBump(false);
                  setSelectedProduct('');
                  setCustomPrice(0);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBump}
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