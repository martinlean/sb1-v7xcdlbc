import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface PaymentErrorProps {
  error: string;
  productName: string;
  amount: number;
  tryAgainUrl?: string;
}

export default function PaymentError() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as PaymentErrorProps;

  if (!data) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ops! Algo deu errado
          </h1>
          
          <p className="text-gray-600">
            Não foi possível processar seu pagamento.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Produto</h3>
              <p className="text-lg font-semibold text-gray-900">{data.productName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Valor</h3>
              <p className="text-lg font-semibold text-gray-900">
                R$ {data.amount.toFixed(2)}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">{data.error}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {data.tryAgainUrl && (
            <button
              onClick={() => navigate(data.tryAgainUrl!)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a página inicial
          </button>

          <p className="text-sm text-gray-500">
            Se o problema persistir, entre em contato com nosso suporte.
          </p>
        </div>
      </div>
    </div>
  );
}