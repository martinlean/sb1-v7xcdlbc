import React, { useState } from 'react';
import { DollarSign, Clock, CheckCircle, X, AlertCircle, CreditCard, QrCode, ArrowRight } from 'lucide-react';
import { useWithdrawals, Withdrawal } from '../hooks/useWithdrawals';
import LoadingSpinner from './LoadingSpinner';

type WithdrawalMethod = 'card' | 'pix';

interface BankInfo {
  bank: string;
  agency: string;
  account: string;
  type: 'checking' | 'savings';
  document: string;
}

interface PixInfo {
  key_type: 'cpf' | 'email' | 'phone' | 'random';
  key_value: string;
}

export default function WithdrawalHistory() {
  const { withdrawals, stats, loading, error, requestWithdrawal } = useWithdrawals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod>('card');
  const [amount, setAmount] = useState('');
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank: '',
    agency: '',
    account: '',
    type: 'checking',
    document: ''
  });
  const [pixInfo, setPixInfo] = useState<PixInfo>({
    key_type: 'cpf',
    key_value: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsProcessing(true);
      setWithdrawalError(null);

      const withdrawalAmount = parseFloat(amount);
      if (withdrawalAmount <= 0) {
        throw new Error('O valor do saque deve ser maior que zero');
      }
      if (withdrawalAmount > stats.available_balance) {
        throw new Error('Saldo insuficiente');
      }

      const paymentInfo = selectedMethod === 'card' ? bankInfo : pixInfo;

      await requestWithdrawal(withdrawalAmount, {
        method: selectedMethod,
        ...paymentInfo
      });

      setIsModalOpen(false);
      setAmount('');
      setBankInfo({
        bank: '',
        agency: '',
        account: '',
        type: 'checking',
        document: ''
      });
      setPixInfo({
        key_type: 'cpf',
        key_value: ''
      });
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      setWithdrawalError(err instanceof Error ? err.message : 'Erro ao solicitar saque');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Histórico de saques</h1>
          <p className="text-gray-400">
            Confira o histórico completo de saques realizados
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-base
            bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
            text-white shadow-lg hover:shadow-blue-500/25
            transition-all duration-200 transform hover:scale-105"
        >
          <DollarSign className="w-5 h-5" />
          Solicitar Saque
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
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
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Total sacado</h3>
          <p className="text-2xl font-semibold text-white">
            R$ {stats.withdrawn_balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Método</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b border-gray-800">
                  <td className="px-6 py-4">
                    {new Date(withdrawal.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    R$ {withdrawal.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      withdrawal.status === 'completed'
                        ? 'bg-green-500/10 text-green-500'
                        : withdrawal.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {withdrawal.status === 'completed' ? 'Concluído' :
                       withdrawal.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {withdrawal.payment_info.method === 'card' ? 'Cartão' : 'PIX'}
                  </td>
                  <td className="px-6 py-4">
                    {withdrawal.payment_info.method === 'card' ? (
                      `${withdrawal.payment_info.bank} - Ag: ${withdrawal.payment_info.agency} Conta: ${withdrawal.payment_info.account}`
                    ) : (
                      `Chave PIX: ${withdrawal.payment_info.key_value}`
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum saque encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <form onSubmit={handleWithdrawalRequest}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Solicitar Saque
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Method Selector */}
                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`flex-1 p-4 rounded-lg border ${
                      selectedMethod === 'card'
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-gray-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className={selectedMethod === 'card' ? 'text-emerald-400' : 'text-gray-400'} />
                      <span className={selectedMethod === 'card' ? 'text-emerald-400' : 'text-gray-400'}>
                        Vendas Cartão
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('pix')}
                    className={`flex-1 p-4 rounded-lg border ${
                      selectedMethod === 'pix'
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-gray-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className={selectedMethod === 'pix' ? 'text-emerald-400' : 'text-gray-400'} />
                      <span className={selectedMethod === 'pix' ? 'text-emerald-400' : 'text-gray-400'}>
                        Vendas PIX/Boleto
                      </span>
                    </div>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Valor do Saque *
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                      step="0.01"
                      min="0"
                      max={stats.available_balance}
                      required
                    />
                  </div>

                  {selectedMethod === 'card' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Banco *
                        </label>
                        <input
                          type="text"
                          value={bankInfo.bank}
                          onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Agência *
                          </label>
                          <input
                            type="text"
                            value={bankInfo.agency}
                            onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Conta *
                          </label>
                          <input
                            type="text"
                            value={bankInfo.account}
                            onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Tipo de Conta *
                        </label>
                        <select
                          value={bankInfo.type}
                          onChange={(e) => setBankInfo({ ...bankInfo, type: e.target.value as 'checking' | 'savings' })}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                          required
                        >
                          <option value="checking">Conta Corrente</option>
                          <option value="savings">Conta Poupança</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          CPF/CNPJ *
                        </label>
                        <input
                          type="text"
                          value={bankInfo.document}
                          onChange={(e) => setBankInfo({ ...bankInfo, document: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Tipo de Chave PIX *
                        </label>
                        <select
                          value={pixInfo.key_type}
                          onChange={(e) => setPixInfo({ ...pixInfo, key_type: e.target.value as 'cpf' | 'email' | 'phone' | 'random' })}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                          required
                        >
                          <option value="cpf">CPF</option>
                          <option value="email">E-mail</option>
                          <option value="phone">Telefone</option>
                          <option value="random">Chave Aleatória</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Chave PIX *
                        </label>
                        <input
                          type="text"
                          value={pixInfo.key_value}
                          onChange={(e) => setPixInfo({ ...pixInfo, key_value: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                {withdrawalError && (
                  <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{withdrawalError}</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 px-6 py-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setWithdrawalError(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > stats.available_balance}
                  className={`
                    px-4 py-2 rounded-lg flex items-center gap-2
                    ${isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > stats.available_balance
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                  `}
                >
                  {isProcessing ? 'Processando...' : 'Solicitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}