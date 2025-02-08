import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  Wallet
} from 'lucide-react';
import AdminLayout from '../components/layouts/AdminLayout';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  sellers: {
    total: number;
    active: number;
    pending: number;
  };
  transactions: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    volume: number;
  };
  products: {
    total: number;
    active: number;
    affiliate_enabled: number;
  };
  withdrawals: {
    pending_count: number;
    pending_amount: number;
  };
}

interface RecentTransaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  customer_name: string;
  product_name: string;
}

interface RecentSeller {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [recentSellers, setRecentSellers] = useState<RecentSeller[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_admin_dashboard_stats', {
          p_period: selectedPeriod
        });

      if (statsError) throw statsError;
      setStats(statsData);

      // Get recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          metadata->>'customer_name' as customer_name,
          metadata->>'product_name' as product_name
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;
      setRecentTransactions(transactionsData || []);

      // Get recent sellers
      const { data: sellersData, error: sellersError } = await supabase
        .from('seller_profiles')
        .select('id, name, email, status, created_at')
        .eq('admin_access', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sellersError) throw sellersError;
      setRecentSellers(sellersData || []);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!stats) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading dashboard stats</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Visão geral do sistema
            </p>
            <div className="flex gap-2">
              {(['today', 'week', 'month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedPeriod === period
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {period === 'today' && 'Hoje'}
                  {period === 'week' && '7 dias'}
                  {period === 'month' && '30 dias'}
                  {period === 'all' && 'Total'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs text-gray-500">
                {selectedPeriod === 'today' && 'Hoje'}
                {selectedPeriod === 'week' && 'Últimos 7 dias'}
                {selectedPeriod === 'month' && 'Últimos 30 dias'}
                {selectedPeriod === 'all' && 'Total'}
              </span>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Volume de vendas</h3>
            <p className="text-2xl font-semibold text-white">
              R$ {stats.transactions.volume.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Usuários ativos</h3>
            <p className="text-2xl font-semibold text-white">
              {stats.users.active}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              De {stats.users.total} usuários totais
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <UserCheck className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Vendedores ativos</h3>
            <p className="text-2xl font-semibold text-white">
              {stats.sellers.active}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              De {stats.sellers.total} vendedores totais
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <ShoppingBag className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Produtos ativos</h3>
            <p className="text-2xl font-semibold text-white">
              {stats.products.active}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.products.affiliate_enabled} com afiliados
            </p>
          </div>
        </div>

        {/* Transaction Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <h3 className="text-sm text-gray-400">Transações aprovadas</h3>
            </div>
            <p className="text-xl font-semibold text-white">{stats.transactions.completed}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm text-gray-400">Transações pendentes</h3>
            </div>
            <p className="text-xl font-semibold text-white">{stats.transactions.pending}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm text-gray-400">Transações falhas</h3>
            </div>
            <p className="text-xl font-semibold text-white">{stats.transactions.failed}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm text-gray-400">Saques pendentes</h3>
            </div>
            <p className="text-xl font-semibold text-white">{stats.withdrawals.pending_count}</p>
            <p className="text-xs text-gray-500 mt-1">
              R$ {stats.withdrawals.pending_amount.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm text-gray-400">Taxa de conversão</h3>
            </div>
            <p className="text-xl font-semibold text-white">
              {stats.transactions.total > 0
                ? ((stats.transactions.completed / stats.transactions.total) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Transações recentes</h2>
              <p className="text-sm text-gray-400">Últimas transações realizadas</p>
            </div>
            <div className="divide-y divide-gray-800">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{transaction.customer_name}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(transaction.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{transaction.product_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        R$ {transaction.amount.toFixed(2)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {transaction.status === 'completed' ? 'Aprovado' :
                         transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Nenhuma transação recente
                </div>
              )}
            </div>
          </div>

          {/* Recent Sellers */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Novos vendedores</h2>
              <p className="text-sm text-gray-400">Últimos vendedores cadastrados</p>
            </div>
            <div className="divide-y divide-gray-800">
              {recentSellers.map((seller) => (
                <div key={seller.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{seller.name}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(seller.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{seller.email}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      seller.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : seller.status === 'pending_verification'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {seller.status === 'active' ? 'Ativo' :
                       seller.status === 'pending_verification' ? 'Pendente' : 'Suspenso'}
                    </span>
                  </div>
                </div>
              ))}
              {recentSellers.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Nenhum vendedor recente
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}