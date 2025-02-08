import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Settings, AlertCircle } from 'lucide-react';

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSession();
  }, [navigate]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Session check error:', err);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        throw new Error('Por favor, preencha todos os campos');
      }

      // Try to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos');
        }
        throw signInError;
      }

      if (!data.session) {
        throw new Error('Sessão não criada após login');
      }

      const { user } = data.session;
      
      // Verify seller profile
      const { data: sellerProfile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          throw new Error('Perfil de vendedor não encontrado');
        }
        throw profileError;
      }

      if (!sellerProfile) {
        throw new Error('Perfil de vendedor não encontrado');
      }

      // Check seller status
      if (sellerProfile.status === 'suspended') {
        throw new Error('Sua conta está suspensa. Entre em contato com o suporte.');
      }

      if (sellerProfile.status === 'banned') {
        throw new Error('Sua conta foi banida. Entre em contato com o suporte.');
      }

      if (sellerProfile.status === 'pending_verification') {
        throw new Error('Sua conta está em análise. Aguarde a aprovação.');
      }

      // Redirect to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Settings button */}
      <div className="absolute top-4 right-4">
        <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <img src="/logo.svg" alt="Logo" className="h-8 mx-auto mb-2" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email input */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Email"
                disabled={loading}
                required
              />
            </div>

            {/* Password input */}
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Senha"
                disabled={loading}
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            {/* Additional links */}
            <div className="flex justify-between gap-4 text-sm">
              <button type="button" className="text-gray-400 hover:text-white transition-colors">
                Quero ver minhas compras
              </button>
              <a 
                href="https://lp.rewardsmidia.online" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Ainda não tenho conta
              </a>
            </div>

            <div className="text-center">
              <button type="button" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                Esqueci minha senha
              </button>
            </div>
          </form>

          {/* Terms */}
          <p className="mt-8 text-xs text-gray-600 text-center">
            Este site é protegido por reCAPTCHA e o Google{' '}
            <a href="#" className="text-blue-500 hover:text-blue-400">Privacy Policy</a> e{' '}
            <a href="#" className="text-blue-500 hover:text-blue-400">Terms of Service</a> se aplicam.
          </p>
        </div>
      </div>
    </div>
  );
}