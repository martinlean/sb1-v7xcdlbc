import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      if (!formData.acceptTerms) {
        throw new Error('Você precisa aceitar os termos de uso');
      }

      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            phone: formData.phone.trim()
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este email já está cadastrado');
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Create seller profile
      const { error: profileError } = await supabase
        .from('seller_profiles')
        .insert([{
          user_id: authData.user.id,
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim(),
          status: 'active' // Set initial status as active
        }]);

      if (profileError) {
        console.error('Error creating seller profile:', profileError);
        // Continue with registration flow even if profile creation fails
        // The trigger will handle profile creation as backup
      }

      // Redirect to success page
      navigate('/register/success', { 
        state: { 
          email: formData.email,
          loginUrl: 'https://app.rewardsmidia.online/login'
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <img src="/logo.svg" alt="Logo" className="h-12 mx-auto" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent border-b border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Digite seu nome completo"
                required
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent border-b border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Digite seu melhor email"
                required
                disabled={loading}
              />
            </div>

            {/* Phone Input */}
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-transparent border-b border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Digite seu telefone para contato"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-transparent border-b border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Digite sua senha de acesso"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-transparent border-b border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Confirme sua senha"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2 mt-6">
              <input
                type="checkbox"
                id="terms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="mt-1"
                required
                disabled={loading}
              />
              <label htmlFor="terms" className="text-xs text-gray-400">
                Concordo que li e aceito os seguintes termos:{' '}
                <a href="#" className="text-white hover:text-gray-300">Políticas de conteúdo</a> e{' '}
                <a href="#" className="text-white hover:text-gray-300">Políticas de responsabilidades</a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded-full py-3 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>

            {/* Additional Links */}
            <div className="flex justify-between gap-4 text-sm">
              <Link to="/purchases" className="text-gray-400 hover:text-white transition-colors">
                Quero ver minhas compras
              </Link>
              <a 
                href="https://app.rewardsmidia.online/login" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Já tenho uma conta
              </a>
            </div>
          </form>

          {/* reCAPTCHA Notice */}
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