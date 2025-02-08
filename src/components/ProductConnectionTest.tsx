import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProductConnectionTest() {
  const [status, setStatus] = useState<{
    auth: boolean;
    products: boolean;
    rls: boolean;
    error?: string;
  }>({
    auth: false,
    products: false,
    rls: false
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Reset status
      setStatus({
        auth: false,
        products: false,
        rls: false
      });

      // Test authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) throw authError;
      
      setStatus(prev => ({
        ...prev,
        auth: Boolean(session)
      }));

      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Test products table access
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (productsError) {
        if (productsError.message.includes('does not exist')) {
          throw new Error('Tabela de produtos não existe');
        }
        throw productsError;
      }

      setStatus(prev => ({
        ...prev,
        products: true
      }));

      // Test RLS policies
      const { data: rlsTestData, error: rlsError } = await supabase
        .from('products')
        .insert([{
          name: 'Test Product',
          description: 'Test Description',
          price: 0,
          image: 'https://test.com/image.jpg',
          user_id: session.user.id
        }])
        .select()
        .single();

      if (rlsError) {
        if (rlsError.message.includes('policy')) {
          throw new Error('Políticas RLS não estão configuradas corretamente');
        }
        throw rlsError;
      }

      // Clean up test data
      if (rlsTestData) {
        await supabase
          .from('products')
          .delete()
          .eq('id', rlsTestData.id);
      }

      setStatus(prev => ({
        ...prev,
        rls: true
      }));

    } catch (err) {
      console.error('Connection test error:', err);
      setStatus(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      }));
    }
  };

  const StatusIcon = ({ success }: { success: boolean }) => {
    if (success) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center text-blue-500 mb-6">
          <Database className="w-12 h-12" />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Teste de Conexão - Produtos
        </h1>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Autenticação</span>
            <StatusIcon success={status.auth} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Tabela de Produtos</span>
            <StatusIcon success={status.products} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Políticas de Segurança</span>
            <StatusIcon success={status.rls} />
          </div>

          {status.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center text-red-800 mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Detalhes do Erro</span>
              </div>
              <p className="text-sm text-red-700">{status.error}</p>
            </div>
          )}

          <button
            onClick={testConnection}
            className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Testar Conexão Novamente
          </button>
        </div>
      </div>
    </div>
  );
}