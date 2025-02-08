import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  Download,
  FileText
} from 'lucide-react';
import AdminLayout from '../components/layouts/AdminLayout';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: 'pix' | 'bank_transfer';
  payment_details: {
    pix_key?: string;
    bank_info?: {
      bank: string;
      agency: string;
      account: string;
      document: string;
    };
  };
  created_at: string;
  seller: {
    name: string;
    email: string;
  };
}

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isProcessingModal, setIsProcessingModal] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          seller:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setWithdrawals(data || []);
    } catch (err) {
      console.error('Error loading withdrawals:', err);
      setError(err instanceof Error ? err.message : 'Error loading withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingError(null);

      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.rpc('log_system_event', {
        p_level: 'info',
        p_category: 'admin',
        p_message: `Withdrawal request ${selectedRequest.id} approved`,
        p_metadata: {
          amount: selectedRequest.amount,
          seller_id: selectedRequest.user_id,
          payment_method: selectedRequest.payment_method
        }
      });

      setIsProcessingModal(false);
      loadWithdrawals();
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      setProcessingError(err instanceof Error ? err.message : 'Error approving withdrawal');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingError(null);

      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.rpc('log_system_event', {
        p_level: 'warn',
        p_category: 'admin',
        p_message: `Withdrawal request ${selectedRequest.id} rejected`,
        p_metadata: {
          amount: selectedRequest.amount,
          seller_id: selectedRequest.user_id,
          payment_method: selectedRequest.payment_method
        }
      });

      setIsProcessingModal(false);
      loadWithdrawals();
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      setProcessingError(err instanceof Error ? err.message : 'Error rejecting withdrawal');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => 
    withdrawal.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdrawal.seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Solicitações de Saque</h1>
          <p className="text-gray-400">
            Gerencie as solicitações de saque dos vendedores
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
                  placeholder="Buscar por nome ou email"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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
                  {status === 'pending' && 'Pendentes'}
                  {status === 'approved' && 'Aprovados'}
                  {status === 'rejected' && 'Rejeitados'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Vendedor</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Método</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{withdrawal.seller.name}</div>
                        <div className="text-xs">{withdrawal.seller.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      R$ {withdrawal.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {withdrawal.payment_method === 'pix' ? 'PIX' : 'Transferência'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        withdrawal.status === 'approved'
                          ? 'bg-green-500/10 text-green-500'
                          : withdrawal.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {withdrawal.status === 'approved' ? 'Aprovado' :
                         withdrawal.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(withdrawal.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(withdrawal);
                            setIsProcessingModal(true);
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                          title="Processar"
                        >
                          {withdrawal.status === 'pending' ? (
                            <FileText className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        {withdrawal.payment_method === 'pix' && (
                          <button
                            onClick={() => handleCopy(withdrawal.payment_details.pix_key!)}
                            className="p-1 hover:bg-gray-800 rounded"
                            title="Copiar chave PIX"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Download payment details as JSON
                            const element = document.createElement('a');
                            const file = new Blob(
                              [JSON.stringify(withdrawal, null, 2)], 
                              {type: 'application/json'}
                            );
                            element.href = URL.createObjectURL(file);
                            element.download = `withdrawal-${withdrawal.id}.json`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                          title="Download detalhes"
                        >
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredWithdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma solicitação de saque encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      {isProcessingModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Processar Solicitação de Saque
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Vendedor
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="font-medium text-white">{selectedRequest.seller.name}</div>
                    <div className="text-sm text-gray-400">{selectedRequest.seller.email}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Valor
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3 font-medium text-white">
                    R$ {selectedRequest.amount.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Método de Pagamento
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3">
                    {selectedRequest.payment_method === 'pix' ? (
                      <div>
                        <div className="font-medium text-white mb-1">PIX</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {selectedRequest.payment_details.pix_key}
                          </span>
                          <button
                            onClick={() => handleCopy(selectedRequest.payment_details.pix_key!)}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-white mb-1">Transferência Bancária</div>
                        <div className="text-sm text-gray-400">
                          <div>Banco: {selectedRequest.payment_details.bank_info?.bank}</div>
                          <div>Agência: {selectedRequest.payment_details.bank_info?.agency}</div>
                          <div>Conta: {selectedRequest.payment_details.bank_info?.account}</div>
                          <div>Documento: {selectedRequest.payment_details.bank_info?.document}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {processingError && (
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{processingError}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsProcessingModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Aprovar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}