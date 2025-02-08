import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, ExternalLink, Share2 } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProductsList() {
  const navigate = useNavigate();
  const { products, loading, error, refresh } = useProducts('own');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = showHidden ? true : !product.hidden;
    return matchesSearch && matchesVisibility;
  });

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      refresh();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Erro ao excluir produto');
    }
  };

  const handleView = (productId: string) => {
    // Open product preview in new tab
    window.open(`https://checkout.rewardsmidia.online/${productId}`, '_blank');
  };

  const handleShare = async (productId: string) => {
    const url = `https://checkout.rewardsmidia.online/${productId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      setTimeout(() => setShareUrl(null), 2000); // Clear after 2 seconds
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Produtos</h1>
            <p className="text-gray-400">
              Gerencie seus produtos e ofertas
            </p>
          </div>
          
          <button
            onClick={() => navigate('/products/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showHidden"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              className="w-4 h-4 bg-gray-800 border-gray-700 rounded"
            />
            <label htmlFor="showHidden" className="text-sm text-gray-400">
              Exibir produtos ocultos
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Preço</th>
                <th className="px-6 py-3">Data de cadastro</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.active
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {product.active ? 'Ativo' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">
                      R$ {product.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(product.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleView(product.id)}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleShare(product.id)}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Compartilhar"
                      >
                        <Share2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate(`/products/${product.id}/settings`)}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Configurações"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg mb-2">Nenhum produto encontrado</p>
                      <p className="text-sm">Clique em "Novo Produto" para começar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share URL Toast */}
      {shareUrl && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Link copiado para a área de transferência!
        </div>
      )}
    </div>
  );
}