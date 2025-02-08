import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, DollarSign, Medal, Download } from 'lucide-react';
import AppLayout from '../../components/layouts/AppLayout';
import { useAffiliates } from '../../hooks/useAffiliates';
import LoadingSpinner from '../../components/LoadingSpinner';

interface RankingItem {
  position: number;
  name: string;
  sales: number;
  commission: number;
  conversion_rate: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export default function AppAffiliateRanking() {
  const { getAffiliateRanking, loading, error } = useAffiliates();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [userRank, setUserRank] = useState<RankingItem | null>(null);
  const [timePeriod, setTimePeriod] = useState<'month' | 'year'>('month');

  useEffect(() => {
    loadRanking();
  }, [timePeriod]);

  const loadRanking = async () => {
    try {
      const data = await getAffiliateRanking(timePeriod);
      setRanking(data.ranking);
      setUserRank(data.userRank);
    } catch (err) {
      console.error('Error loading ranking:', err);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'text-amber-600';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-400';
      case 'platinum': return 'text-blue-400';
      case 'diamond': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Ranking de Afiliados</h1>
          <p className="text-gray-400">
            Acompanhe sua posição e conquiste recompensas exclusivas
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-800 p-1">
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timePeriod === 'month'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Este mês
            </button>
            <button
              onClick={() => setTimePeriod('year')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timePeriod === 'year'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Este ano
            </button>
          </div>
        </div>

        {/* Your Rank */}
        {userRank && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Sua posição</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${getLevelColor(userRank.level)}`} />
                    <span className={`font-medium ${getLevelColor(userRank.level)}`}>
                      Nível {userRank.level}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    #{userRank.position}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Vendas</div>
                  <div className="text-lg font-semibold text-white">{userRank.sales}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Comissão</div>
                  <div className="text-lg font-semibold text-white">
                    R$ {userRank.commission.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Conversão</div>
                  <div className="text-lg font-semibold text-white">
                    {userRank.conversion_rate.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Top Afiliados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Posição</th>
                  <th className="px-6 py-3">Afiliado</th>
                  <th className="px-6 py-3">Nível</th>
                  <th className="px-6 py-3">Vendas</th>
                  <th className="px-6 py-3">Comissão</th>
                  <th className="px-6 py-3">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item) => (
                  <tr key={item.position} className="border-b border-gray-800">
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        {item.position <= 3 ? (
                          <Medal className={`w-5 h-5 ${
                            item.position === 1 ? 'text-yellow-400' :
                            item.position === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                        ) : (
                          `#${item.position}`
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${getLevelColor(item.level)}`}>
                        {item.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.sales}</td>
                    <td className="px-6 py-4">
                      R$ {item.commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {item.conversion_rate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}