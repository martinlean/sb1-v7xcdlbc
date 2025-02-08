import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ConnectionTest() {
  const [status, setStatus] = useState<{
    url: boolean;
    key: boolean;
    connection: boolean;
    products: boolean;
    error?: string;
  }>({
    url: false,
    key: false,
    connection: false,
    products: false
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    // Reset status
    setStatus({
      url: false,
      key: false,
      connection: false,
      products: false
    });

    // Check URL and Key
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    setStatus(prev => ({
      ...prev,
      url: Boolean(url),
      key: Boolean(key)
    }));

    if (!url || !key) {
      return setStatus(prev => ({
        ...prev,
        error: 'Missing Supabase credentials'
      }));
    }

    try {
      // Test basic connection
      const { error: pingError } = await supabase.from('products').select('count');
      
      setStatus(prev => ({
        ...prev,
        connection: !pingError,
        products: !pingError,
        error: pingError?.message
      }));

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
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
          Database Connection Test
        </h1>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Supabase URL</span>
            <StatusIcon success={status.url} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Supabase Key</span>
            <StatusIcon success={status.key} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Database Connection</span>
            <StatusIcon success={status.connection} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Products Table</span>
            <StatusIcon success={status.products} />
          </div>

          {status.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center text-red-800 mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Error Details</span>
              </div>
              <p className="text-sm text-red-700">{status.error}</p>
            </div>
          )}

          <button
            onClick={testConnection}
            className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Test Connection Again
          </button>
        </div>
      </div>
    </div>
  );
}