import React, { useState } from 'react';
import AdminLayout from '../components/layouts/AdminLayout';
import { Search, Eye, MessageSquare } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, loading, error } = useCustomers();

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const filteredCustomers = customers.filter(customer => 
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Clientes</h1>
          <p className="text-gray-400">
            Lista de clientes cadastrados no sistema
          </p>
        </div>

        {/* Search */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Filtros</h2>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10"
              placeholder="Nome/email do cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3">Tx. aprovadas</th>
                  <th className="px-6 py-3">Data de cadastro</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="border-b border-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{customer.name}</div>
                        <div className="text-xs">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{customer.phone}</td>
                    <td className="px-6 py-4">{customer.successful_transactions}</td>
                    <td className="px-6 py-4">
                      {new Date(customer.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-800 rounded">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-800 rounded">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}