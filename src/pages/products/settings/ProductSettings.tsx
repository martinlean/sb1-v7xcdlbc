import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PaymentSettings from './PaymentSettings';
import AppearanceSettings from './AppearanceSettings';
import OrderBumpsSettings from './OrderBumpsSettings';
import UpsellSettings from './UpsellSettings';
import AffiliateSettings from './AffiliateSettings';
import OffersList from '../OffersList';

type TabType = 'offers' | 'appearance' | 'payment' | 'order-bumps' | 'upsell' | 'affiliates';

export default function ProductSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('offers');
  const { id } = useParams();
  const navigate = useNavigate();

  const tabs: { id: TabType; label: string }[] = [
    { id: 'offers', label: 'Ofertas' },
    { id: 'appearance', label: 'Aparência' },
    { id: 'payment', label: 'Pagamento' },
    { id: 'order-bumps', label: 'Order Bumps' },
    { id: 'upsell', label: 'Upsell/Downsell' },
    { id: 'affiliates', label: 'Afiliação' }
  ];

  if (!id) {
    navigate('/products');
    return null;
  }

  const handleSave = () => {
    // Refresh product data
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para produtos
        </button>
        <h1 className="text-2xl font-bold text-white">Configurações do Produto</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-800">
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        {activeTab === 'offers' && (
          <OffersList />
        )}
        {activeTab === 'appearance' && (
          <AppearanceSettings productId={id} onSave={handleSave} />
        )}
        {activeTab === 'payment' && (
          <PaymentSettings productId={id} onSave={handleSave} />
        )}
        {activeTab === 'order-bumps' && (
          <OrderBumpsSettings productId={id} onSave={handleSave} />
        )}
        {activeTab === 'upsell' && (
          <UpsellSettings productId={id} onSave={handleSave} />
        )}
        {activeTab === 'affiliates' && (
          <AffiliateSettings productId={id} onSave={handleSave} />
        )}
      </div>
    </div>
  );
}