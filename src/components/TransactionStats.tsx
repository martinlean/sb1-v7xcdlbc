import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, XCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';

interface TransactionStats {
  paid: { count: number; total: number };
  pending: { count: number; total: number };
  failed: { count: number; total: number };
  chargeback: { count: number; total: number };
  refunded: { count: number; total: number };
  total_transactions: number;
  total_amount: number;
}

export default function TransactionStats() {
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadStats();
    
    // Subscribe to stats updates
    const subscription = supabase
      .channel('transaction_stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments'
      }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc(
        'get_transaction_stats',
        { 
          user_id: user.id,
          period: period
        }
      );

      if (error) throw error;
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err instanceof Error ? err.message : 'Error loading stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Pago',
      icon: <DollarSign className="w-5 h-5 text-green-500" />,
      count: stats.paid.count,
      total: stats.total_transactions,
      amount: stats.paid.total,
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },
    {
      label: 'Pendente',
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      count: stats.pending.count,
      total: stats.total_transactions,
      amount: stats.pending.total,
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-500'
    },
    {
      label: 'Falhou',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      count: stats.failed.count,
      total: stats.total_transactions,
      amount: stats.failed.total,
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-500'
    },
    {
      label: 'Chargeback',
      icon: <RotateCcw className="w-5 h-5 text-orange-500" />,
      count: stats.chargeback.count,
      total: stats.total_transactions,
      amount: stats.chargeback.total,
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-500'
    },
    {
      label: 'Reembolsado',
      icon: <RefreshCw className="w-5 h-5 text-purple-500" />,
      count: stats.refunded.count,
      total: stats.total_transactions,
      amount: stats.refunded.total,
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              {stat.icon}
            </div>
            <span className="text-xs text-gray-500">
              {stat.count}/{stat.total}
            </span>
          </div>
          <h3 className="text-sm text-gray-400 mb-1">{stat.label}</h3>
          <p className="text-xl font-semibold text-white">
            {formatCurrency(stat.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}