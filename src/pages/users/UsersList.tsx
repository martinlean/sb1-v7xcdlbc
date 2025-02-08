import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  Eye,
  XCircle,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'banned';
  admin_access: boolean;
  created_at: string;
  stats: {
    total_sales: number;
    total_revenue: number;
    available_balance: number;
    products_count: number;
    affiliates_count: number;
  };
}

export default function UsersList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailsModal, setIsDetailsModal] = useState(false);
  const [isConfirmModal, setIsConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'ban' | 'activate' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('seller_profiles')
        .select(`
          *,
          stats:user_id (
            total_sales:payments(count),
            total_revenue:payments(sum(amount)),
            available_balance:rpc$get_available_balance(),
            products_count:products(count),
            affiliates_count:affiliates(count)
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: 'suspend' | 'ban' | 'activate') => {
    if (!selectedUser) return;

    try {
      setActionError(null);

      const newStatus = action === 'activate' ? 'active' 
                     : action === 'suspend' ? 'suspended'
                     : 'banned';

      const { error: updateError } = await supabase
        .from('seller_profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.rpc('log_system_event', {
        p_level: 'warn',
        p_category: 'admin',
        p_message: `User ${selectedUser.email} ${action}ed`,
        p_metadata: {
          user_id: selectedUser.user_id,
          previous_status: selectedUser.status,
          new_status: newStatus
        }
      });

      setIsConfirmModal(false);
      setConfirmAction(null);
      loadUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setActionError(err instanceof Error ? err.message : 'Error updating user status');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Usuários</h1>
        <p className="text-gray-400">
          Gerencie os usuários do sistema
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 p-2.5"
                placeholder="Buscar por nome, email ou telefone"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'suspended', 'banned'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg ${
                  filter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status === 'all' && 'Todos'}
                {status === 'active' && 'Ativos'}
                {status === 'suspended' && 'Suspensos'}
                {status === 'banned' && 'Banidos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Vendas</th>
                <th className="px-6 py-3">Saldo</th>
                <th className="px-6 py-3">Produtos</th>
                <th className="px-6 py-3">Cadastro</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : user.status === 'suspended'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {user.status === 'active' ? 'Ativo' :
                       user.status === 'suspended' ? 'Suspenso' : 'Banido'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">
                      {user.stats.total_sales || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      R$ {user.stats.total_revenue?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">
                      R$ {user.stats.available_balance?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">
                      {user.stats.products_count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.stats.affiliates_count || 0} afiliados
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDetailsModal(true);
                        }}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setConfirmAction('suspend');
                            setIsConfirmModal(true);
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                          title="Suspender"
                        >
                          <UserX className="w-4 h-4 text-yellow-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setConfirmAction('activate');
                            setIsConfirmModal(true);
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                          title="Ativar"
                        >
                          <UserCheck className="w-4 h-4 text-green-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {isDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                Detalhes do Usuário
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Nome
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3 text-white">
                      {selectedUser.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Email
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-white">{selectedUser.email}</span>
                      <button
                        onClick={() => handleCopy(selectedUser.email)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Telefone
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3 text-white">
                      {selectedUser.phone || 'Não informado'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Data de cadastro
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3 text-white">
                      {new Date(selectedUser.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Vendas
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xl font-medium text-white">
                        {selectedUser.stats.total_sales || 0}
                      </div>
                      <div className="text-sm text-gray-400">
                        R$ {selectedUser.stats.total_revenue?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Saldo disponível
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xl font-medium text-white">
                        R$ {selectedUser.stats.available_balance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Produtos
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xl font-medium text-white">
                        {selectedUser.stats.products_count || 0}
                      </div>
                      <div className="text-sm text-gray-400">
                        {selectedUser.stats.affiliates_count || 0} afiliados
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Status da conta
                    </label>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedUser.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : selectedUser.status === 'suspended'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {selectedUser.status === 'active' ? 'Ativo' :
                         selectedUser.status === 'suspended' ? 'Suspenso' : 'Banido'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsDetailsModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Fechar
              </button>
              {selectedUser.status === 'active' ? (
                <button
                  onClick={() => {
                    setIsDetailsModal(false);
                    setConfirmAction('suspend');
                    setIsConfirmModal(true);
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Suspender
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsDetailsModal(false);
                    setConfirmAction('activate');
                    setIsConfirmModal(true);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Ativar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {isConfirmModal && selectedUser && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                {confirmAction === 'activate' && (
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-500" />
                  </div>
                )}
                {confirmAction === 'suspend' && (
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  </div>
                )}
                {confirmAction === 'ban' && (
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-medium text-white text-center mb-2">
                {confirmAction === 'activate' && 'Ativar usuário'}
                {confirmAction === 'suspend' && 'Suspender usuário'}
                {confirmAction === 'ban' && 'Banir usuário'}
              </h3>

              <p className="text-gray-400 text-center mb-6">
                {confirmAction === 'activate' && 'Tem certeza que deseja ativar este usuário?'}
                {confirmAction === 'suspend' && 'Tem certeza que deseja suspender este usuário?'}
                {confirmAction === 'ban' && 'Tem certeza que deseja banir este usuário?'}
              </p>

              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="font-medium text-white">{selectedUser.name}</div>
                <div className="text-sm text-gray-400">{selectedUser.email}</div>
              </div>

              {actionError && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2 mb-6">
                  <AlertCircle className="w-4 h-4" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-800 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsConfirmModal(false);
                  setConfirmAction(null);
                  setActionError(null);
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleStatusChange(confirmAction)}
                className={`px-4 py-2 rounded-lg ${
                  confirmAction === 'activate'
                    ? 'bg-green-500 hover:bg-green-600'
                    : confirmAction === 'suspend'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}