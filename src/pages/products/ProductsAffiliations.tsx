import React from 'react';
import { useProducts } from '../../hooks/useProducts';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProductsAffiliations() {
  const { products, loading, error } = useProducts('affiliate');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Minhas Afiliações</h1>
        <p className="text-gray-400">
          Gerencie seus produtos afiliados
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">
                  R$ {product.price.toFixed(2)}
                </span>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Ver detalhes
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400">Você ainda não tem produtos afiliados</p>
          </div>
        )}
      </div>
    </div>
  );
}