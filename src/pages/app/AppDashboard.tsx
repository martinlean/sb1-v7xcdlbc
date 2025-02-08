import React, { useState } from 'react';
import { DollarSign, Clock, CheckCircle, BarChart3, ChevronDown } from 'lucide-react';
import AppLayout from '../../components/layouts/AppLayout';
import { useTransactions } from '../../hooks/useTransactions';
import LoadingSpinner from '../../components/LoadingSpinner';

type TimePeriod = 'today' | 'yesterday' | 'last_week' | 'current_month' | 'last_month' | 'last_30_days' | 'last_3_months' | 'last_6_months' | 'last_year' | 'total' | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export default function AppDashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_week');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(),
    endDate: new Date()
  });
  const { transactions, stats, loading, error } = useTransactions();

  const timePeriodLabels: Record<TimePeriod, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    last_week: 'Última semana',
    current_month: 'Mês atual',
    last_month: 'Mês anterior',
    last_30_days: 'Últimos 30 dias',
    last_3_months: 'Últimos 3 meses',
    last_6_months: 'Últimos 6 meses',
    last_year: 'Último ano',
    total: 'Total',
    custom: 'Personalizado'
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AppLayout>
      <div className="p-6">
        {/* Time Period Selector */}
        <div className="mb-6 flex justify-end">
          <div className="relative">
            <button
              onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-800 hover:bg-gray-800"
            >
              {timePeriodLabels[timePeriod]}
              <ChevronDown className="w-4 h-4" />
            </button>

            {isTimePickerOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-800 py-1 z-50">
                {Object.entries(timePeriodLabels).map(([key, label]) => (
                  <button
                    key={key}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${
                      timePeriod === key ? 'text-blue-400' : 'text-gray-400'
                    }`}
                    onClick={() => {
                      setTimePeriod(key as TimePeriod);
                      setIsTimePickerOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs text-gray-500">
                {timePeriodLabels[timePeriod]}
              </span>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Saldo disponível</h3>
            <p className="text-2xl font-semibold text-white">
              R$ {stats.available_balance.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-xs text-gray-500">
                {timePeriodLabels[timePeriod]}
              </span>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Saldo pendente</h3>
            <p className="text-2xl font-semibold text-white">
              R$ {stats.pending_balance.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-gray-500">
                {timePeriodLabels[timePeriod]}
              </span>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Total sacado</h3>
            <p className="text-2xl font-semibold text-white">
              R$ {stats.withdrawn_balance.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-xs text-gray-500">
                {timePeriodLabels[timePeriod]}
              </span>
            </div>
            <h3 className="text-sm text-gray-400 mb-1">Lucro líquido</h3>
            <p className="text-2xl font-semibold text-white">
              R$ {stats.net_profit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Transaction Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-sm text-gray-400 mb-2">Transações pagas</h3>
            <p className="text-xl font-semibold text-white">{stats.transactions_count.paid}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-sm text-gray-400 mb-2">Transações pendentes</h3>
            <p className="text-xl font-semibold text-white">{stats.transactions_count.pending}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-sm text-gray-400 mb-2">Transações falhas</h3>
            <p className="text-xl font-semibold text-white">{stats.transactions_count.failed}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-sm text-gray-400 mb-2">Chargebacks</h3>
            <p className="text-xl font-semibold text-white">{stats.transactions_count.chargeback}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-sm text-gray-400 mb-2">Reembolsos</h3>
            <p className="text-xl font-semibold text-white">{stats.transactions_count.refunded}</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Transações recentes</h2>
            <p className="text-sm text-gray-400">Últimas transações realizadas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions && transactions.slice(0, 5).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{transaction.customer_name}</div>
                        <div className="text-xs">{transaction.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{transaction.product_name}</td>
                    <td className="px-6 py-4">R$ {transaction.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {transaction.status === 'completed' ? 'Concluído' :
                         transaction.status === 'pending' ? 'Pendente' :
                         transaction.status === 'failed' ? 'Falhou' :
                         'Reembolsado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(transaction.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}