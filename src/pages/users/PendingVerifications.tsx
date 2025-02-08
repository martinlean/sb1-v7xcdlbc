import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  UserCheck, 
  UserX,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

interface PendingUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  documents: {
    id: string;
    type: string;
    status: string;
    url: string;
  }[];
}

export default function PendingVerifications() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [isViewingDocuments, setIsViewingDocuments] = useState(false);
  const [isConfirmModal, setIsConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: users, error: usersError } = await supabase
        .from('seller_profiles')
        .select(`
          *,
          documents:seller_documents(
            id,
            type,
            status,
            url
          )
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(users || []);
    } catch (err) {
      console.error('Error loading pending users:', err);
      setError(err instanceof Error ? err.message : 'Error loading pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return;

    try {
      setActionError(null);

      const { error: updateError } = await supabase
        .from('seller_profiles')
        .update({ 
          status: action === 'approve' ? 'active' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.rpc('log_system_event', {
        p_level: action === 'approve' ? 'info' : 'warn',
        p_category: 'admin',
        p_message: `User ${selectedUser.email} ${action}d`,
        p_metadata: {
          user_id: selectedUser.user_id,
          documents: selectedUser.documents
        }
      });

      setIsConfirmModal(false);
      setConfirmAction(null);
      loadPendingUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setActionError(err instanceof Error ? err.message : 'Error updating user status');
    }
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
        <h1 className="text-2xl font-bold text-white mb-2">Verificações Pendentes</h1>
        <p className="text-gray-400">
          Gerencie as verificações pendentes de usuários
        </p>
      </div>

      {/* Search */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
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

      {/* Users Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Documentos</th>
                <th className="px-6 py-3">Data de cadastro</th>
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
                    <div className="flex items-center gap-2">
                      {user.documents.map((doc) => (
                        <span
                          key={doc.id}
                          className={`px-2 py-1 text-xs rounded-full ${
                            doc.status === 'verified'
                              ? 'bg-green-500/10 text-green-500'
                              : doc.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {doc.type === 'selfie' && 'Selfie'}
                          {doc.type === 'identity' && 'RG/CNH'}
                          {doc.type === 'address' && 'Endereço'}
                          {doc.type === 'social_contract' && 'Contrato'}
                        </span>
                      ))}
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
                          setIsViewingDocuments(true);
                        }}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Ver documentos"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setConfirmAction('approve');
                          setIsConfirmModal(true);
                        }}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Aprovar"
                      >
                        <UserCheck className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setConfirmAction('reject');
                          setIsConfirmModal(true);
                        }}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Rejeitar"
                      >
                        <UserX className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma verificação pendente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {isViewingDocuments && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                Documentos do Usuário
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Usuário
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="font-medium text-white">{selectedUser.name}</div>
                    <div className="text-sm text-gray-400">{selectedUser.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedUser.documents.map((doc) => (
                    <div key={doc.id} className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="p-3 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">
                            {doc.type === 'selfie' && 'Selfie com documento'}
                            {doc.type === 'identity' && 'RG/CNH'}
                            {doc.type === 'address' && 'Comprovante de endereço'}
                            {doc.type === 'social_contract' && 'Contrato Social'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            doc.status === 'verified'
                              ? 'bg-green-500/10 text-green-500'
                              : doc.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {doc.status === 'verified' ? 'Verificado' :
                             doc.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                          </span>
                        </div>
                      </div>
                      <div className="aspect-video">
                        <img
                          src={doc.url}
                          alt={doc.type}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-3 border-t border-gray-700">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Abrir em nova aba
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsViewingDocuments(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setIsViewingDocuments(false);
                  setConfirmAction('reject');
                  setIsConfirmModal(true);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Rejeitar
              </button>
              <button
                onClick={() => {
                  setIsViewingDocuments(false);
                  setConfirmAction('approve');
                  setIsConfirmModal(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Aprovar
              </button>
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
                {confirmAction === 'approve' && (
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                )}
                {confirmAction === 'reject' && (
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-medium text-white text-center mb-2">
                {confirmAction === 'approve' ? 'Aprovar verificação' : 'Rejeitar verificação'}
              </h3>

              <p className="text-gray-400 text-center mb-6">
                {confirmAction === 'approve'
                  ? 'Tem certeza que deseja aprovar a verificação deste usuário?'
                  : 'Tem certeza que deseja rejeitar a verificação deste usuário?'}
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
                onClick={() => handleVerification(confirmAction)}
                className={`px-4 py-2 rounded-lg ${
                  confirmAction === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
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