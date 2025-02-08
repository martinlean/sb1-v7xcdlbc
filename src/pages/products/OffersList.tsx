import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Copy, Link2, Settings, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Offer {
  id: string;
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
  product_id: string;
}

export default function OffersList() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    loadOffersAndProduct();
  }, [productId]);

  const loadOffersAndProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!productId) {
        throw new Error('Product ID is required');
      }

      // First get product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, payment_settings')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Then get offers
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      setOffers(offersData || []);

    } catch (err) {
      console.error('Error loading offers:', err);
      setError(err instanceof Error ? err.message : 'Error loading offers');
    } finally {
      setLoading(false);
    }
  };

  const generateCheckoutUrl = (offer: Offer) => {
    if (!offer.product_id || !offer.id) return '';
    
    const processor = product?.payment_settings?.processor || 'stripe';
    const domain = processor === 'stripe' 
      ? 'checkout.rewardsmidia.online'
      : 'pay.rewardsmidia.online';
    
    return `https://${domain}/${offer.product_id}/${offer.id}`;
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) return <LoadingSpinner />;

  if (!productId) {
    navigate('/products');
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">Ofertas</h3>
          <p className="text-sm text-gray-400">
            Gerencie as ofertas e links de divulgação do seu produto
          </p>
        </div>
        <button
          onClick={() => navigate(`/products/${productId}/offers/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Nova Oferta
        </button>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-medium">{offer.name}</h4>
                <p className="text-sm text-gray-400">{offer.internal_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/products/${productId}/offers/${offer.id}`)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Configurações"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleCopyLink(generateCheckoutUrl(offer))}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <a
                  href={generateCheckoutUrl(offer)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-400">Preço</span>
                <p className="text-white">
                  {new Intl.NumberFormat(offer.language, {
                    style: 'currency',
                    currency: offer.currency
                  }).format(offer.price)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Idioma</span>
                <p className="text-white">{offer.language}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Status</span>
                <p className={`text-sm ${offer.active ? 'text-green-500' : 'text-yellow-500'}`}>
                  {offer.active ? 'Ativo' : 'Rascunho'}
                </p>
              </div>
            </div>

            {/* Link Preview */}
            <div className="mt-4 p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Link de checkout</span>
                </div>
                <button
                  onClick={() => handleCopyLink(generateCheckoutUrl(offer))}
                  className={`text-sm ${copiedLink === generateCheckoutUrl(offer) ? 'text-green-500' : 'text-blue-500 hover:text-blue-400'}`}
                >
                  {copiedLink === generateCheckoutUrl(offer) ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <input
                type="text"
                value={generateCheckoutUrl(offer)}
                readOnly
                className="mt-2 w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300"
              />
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400">
              Nenhuma oferta cadastrada. Clique em "Nova Oferta" para começar.
            </p>
          </div>
        )}
      </div>

      {/* Copy URL Toast */}
      {copiedLink && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Link copiado para a área de transferência!
        </div>
      )}
    </div>
  );
}