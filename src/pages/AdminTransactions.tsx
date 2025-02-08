import React, { useState } from 'react';
import AdminLayout from '../components/layouts/AdminLayout';
import { Search } from 'lucide-react';

export default function AdminTransactions() {
  const [filters, setFilters] = useState({
    email: '',
    paymentMethod: '',
    status: '',
    offerCode: ''
  });

  const stats = [
    { label: 'Pago', value: 'R$ 0,00', count: '0/0' },
    { label: 'Pendente', value: 'R$ 0,00', count: '0/0' },
    { label: 'Falhou', value: 'R$ 0,00', count: '0/0' },
    { label: 'Chargeback', value: 'R$ 0,00', count: '0/0' },
    { label: 'Reembolsado', value: 'R$ 0,00', count: '0/0' }
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Histórico de transações</h1>
          <p className="text-gray-400">
            Acompanhe o histórico completo de transações do seu negócio
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{stat.label}</span>
                <span className="text-xs text-gray-500">{stat.count}</span>
              </div>
              <p className="text-xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
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
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg mb-2">Nenhuma transação encontrada</p>
                      <p className="text-sm">As transações aparecerão aqui assim que forem realizadas</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}