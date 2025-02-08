import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, Link2, Copy, QrCode, Share2, Download, Filter } from 'lucide-react';
import AppLayout from '../../components/layouts/AppLayout';
import { useAffiliates } from '../../hooks/useAffiliates';
import LoadingSpinner from '../../components/LoadingSpinner';

type TimePeriod = 'today' | 'yesterday' | 'last_week' | 'current_month' | 'last_month' | 'last_30_days' | 'last_3_months' | 'last_6_months' | 'last_year' | 'total' | 'custom';

export default function AppAffiliateDashboard() {
  const navigate = useNavigate();
  const { getAffiliateStats, getAffiliateLinks, loading, error } = useAffiliates();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_30_days');
  const [stats, setStats] = useState<any>(null);
  const [affiliateLinks, setAffiliateLinks] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timePeriod, selectedProduct]);

  const loadData = async () => {
    try {
      if (selectedProduct) {
        const [statsData, linksData] = await Promise.all([
          getAffiliateStats(selectedProduct),
          getAffiliateLinks(selectedProduct)
        ]);
        setStats(statsData);
        setAffiliateLinks(linksData);
      }
    } catch (err) {
      console.error('Error loading affiliate data:', err);
    }
  };

  const handleCopyLink = (type: string) => {
    if (affiliateLinks[type]) {
      navigator.clipboard.writeText(affiliateLinks[type]);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleDownloadQRCode = () => {
    // Implementation for QR code download
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard de Afiliados</h1>
          <p className="text-gray-400">
            Acompanhe suas vendas, comissões e links de afiliado
          </p>
        </div>

        {/* Product Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <select
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
            >
              <option value="">Selecione um produto</option>
              {/* Add product options dynamically */}
            </select>

            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="last_week">Última semana</option>
              <option value="current_month">Mês atual</option>
              <option value="last_month">Mês anterior</option>
              <option value="last_30_days">Últimos 30 dias</option>
              <option value="last_3_months">Últimos 3 meses</option>
              <option value="last_6_months">Últimos 6 meses</option>
              <option value="last_year">Último ano</option>
              <option value="total">Total</option>
            </select>
          </div>
        </div>

        {stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Comissões ganhas</h3>
                <p className="text-2xl font-semibold text-white">
                  R$ {stats.total_commission.toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Vendas realizadas</h3>
                <p className="text-2xl font-semibold text-white">
                  {stats.total_sales}
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Taxa de conversão</h3>
                <p className="text-2xl font-semibold text-white">
                  {stats.conversion_rate.toFixed(2)}%
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Link2 className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Cliques</h3>
                <p className="text-2xl font-semibold text-white">
                  {stats.clicks}
                </p>
              </div>
            </div>

            {/* Affiliate Links */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Links de afiliado</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {/* Share implementation */}}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(affiliateLinks).map(([type, url]) => (
                  <div key={type} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        {type === 'default' ? 'Link principal' : `Link para ${type}`}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={url}
                          readOnly
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                        />
                        <button
                          onClick={() => handleCopyLink(type)}
                          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">QR Code do link de afiliado</h3>
              
              <div className="flex justify-center mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(affiliateLinks.default)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleDownloadQRCode()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}