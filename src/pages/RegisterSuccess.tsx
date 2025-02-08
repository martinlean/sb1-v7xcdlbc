import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface LocationState {
  email?: string;
  loginUrl?: string;
}

export default function RegisterSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, loginUrl } = location.state as LocationState || {};

  const handleLogin = () => {
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      window.location.href = 'https://app.rewardsmidia.online/login';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Conta criada com sucesso!</h1>
          <p className="text-gray-400">
            {email ? (
              <>
                Enviamos um email de confirmação para <span className="text-white">{email}</span>. 
                Por favor, verifique sua caixa de entrada e siga as instruções para ativar sua conta.
              </>
            ) : (
              'Enviamos um email de confirmação para você. Por favor, verifique sua caixa de entrada e siga as instruções para ativar sua conta.'
            )}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white rounded-full py-3 text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            Ir para o login
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-800 text-white rounded-full py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Voltar para a página inicial
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Não recebeu o email? Verifique sua pasta de spam ou{' '}
          <button onClick={handleLogin} className="text-blue-500 hover:text-blue-400">
            tente fazer login
          </button>{' '}
          para reenviar a confirmação.
        </p>
      </div>
    </div>
  );
}