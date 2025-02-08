import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Document {
  id: string;
  type: 'selfie' | 'identity' | 'address' | 'social_contract';
  status: 'pending' | 'verified' | 'rejected';
  url: string;
  created_at: string;
  updated_at: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('seller_documents')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    try {
      setUploadingType(type);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('seller-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('seller-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { error: insertError } = await supabase
        .from('seller_documents')
        .insert([{
          user_id: user.id,
          type,
          status: 'pending',
          url: publicUrl
        }]);

      if (insertError) throw insertError;

      loadDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Error uploading document');
    } finally {
      setUploadingType(null);
    }
  };

  const renderUploadSection = (
    type: string,
    title: string,
    description: string,
    acceptedTypes: string = '.jpg,.jpeg,.png,.pdf'
  ) => {
    const doc = documents.find(d => d.type === type);
    const isUploading = uploadingType === type;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{description}</p>

        {doc ? (
          <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {doc.status === 'verified' && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {doc.status === 'rejected' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              {doc.status === 'pending' && (
                <div className="w-5 h-5 border-2 border-yellow-500 rounded-full" />
              )}
              <span className="text-sm text-gray-300">
                {doc.status === 'verified' && 'Documento verificado'}
                {doc.status === 'rejected' && 'Documento rejeitado'}
                {doc.status === 'pending' && 'Em análise'}
              </span>
            </div>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Visualizar
            </a>
          </div>
        ) : (
          <label className="block">
            <div className="relative border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
              <input
                type="file"
                accept={acceptedTypes}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(type, file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400 text-center">
                  {isUploading ? (
                    'Enviando...'
                  ) : (
                    <>
                      Arraste e solte ou clique para selecionar
                      <br />
                      <span className="text-xs">
                        Formatos aceitos: {acceptedTypes.replace(/\./g, ' ')}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Documentos</h1>
        <p className="text-gray-400">
          Envie seus documentos para verificação da sua conta
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        {renderUploadSection(
          'selfie',
          'Selfie com documento',
          'Tire uma foto sua segurando seu documento de identificação. Seu rosto e o documento devem estar claramente visíveis.',
          '.jpg,.jpeg,.png'
        )}

        {renderUploadSection(
          'identity',
          'Documento de identificação',
          'Envie uma foto ou scan do seu documento de identificação (RG, CNH). Envie frente e verso em um único arquivo.',
          '.jpg,.jpeg,.png,.pdf'
        )}

        {renderUploadSection(
          'address',
          'Comprovante de endereço',
          'Envie um comprovante de endereço recente (últimos 3 meses). Pode ser conta de luz, água, telefone, etc.',
          '.jpg,.jpeg,.png,.pdf'
        )}

        {renderUploadSection(
          'social_contract',
          'Contrato social',
          'Envie o contrato social completo da sua empresa. Deve conter todas as páginas e estar legível.',
          '.pdf'
        )}
      </div>
    </div>
  );
}