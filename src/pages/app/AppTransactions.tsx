import React, { useState } from 'react';
import AppLayout from '../../components/layouts/AppLayout';
import { Search } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AppTransactions() {
  const [filters, setFilters] = useState({
    email: '',
    paymentMethod: '',
    status: '',
    offerCode: ''
  });

  const { transactions, stats, loading, error } = useTransactions();

  if (loading) return <LoadingSpinner />;

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Histórico de transações</h1>
          <p className="text-gray-400">
            Acompanhe o histórico completo de transações do seu negócio
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Pago</span>
              <span className="text-xs text-gray-500">{stats.transactions_count.paid}/0</span>
            </div>
            <p className="text-xl font-semibold text-white">R$ {stats.available_balance.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Pendente</span>
              <span className="text-xs text-gray-500">{stats.transactions_count.pending}/0</span>
            </div>
            <p className="text-xl font-semibold text-white">R$ {stats.pending_balance.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Falhou</span>
              <span className="text-xs text-gray-500">{stats.transactions_count.failed}/0</span>
            </div>
            <p className="text-xl font-semibold text-white">R$ 0,00</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Chargeback</span>
              <span className="text-xs text-gray-500">{stats.transactions_count.chargeback}/0</span>
            </div>
            <p className="text-xl font-semibold text-white">R$ 0,00</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Reembolsado</span>
              <span className="text-xs text-gray-500">{stats.transactions_count.refunded}/0</span>
            </div>
            <p className="text-xl font-semibold text-white">R$ 0,00</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Email do cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10"
                  placeholder="Buscar por email"
                  value={filters.email}
                  onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Método de pagamento
              </label>
              <select
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="credit_card">Cartão de crédito</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="completed">Concluído</option>
                <option value="pending">Pendente</option>
                <option value="failed">Falhou</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Código da oferta
              </label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                placeholder="Digite o código"
                value={filters.offerCode}
                onChange={(e) => setFilters({ ...filters, offerCode: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Pagamento</th>
                  <th className="px-6 py-3">Data de criação</th>
                  <th className="px-6 py-3">Valor líquido</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions && transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{transaction.customer_name}</div>
                        <div className="text-xs">{transaction.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{transaction.product_name}</td>
                    <td className="px-6 py-4">{transaction.payment_method}</td>
                    <td className="px-6 py-4">
                      {new Date(transaction.created_at).toLocaleString('pt-BR')}
                    </td>
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
                  </tr>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-lg mb-2">Nenhuma transação encontrada</p>
                        <p className="text-sm">As transações aparecerão aqui assim que forem realizadas</p>
                      </div>
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