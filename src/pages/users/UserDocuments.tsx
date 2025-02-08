import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Eye, 
  Download,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/LoadingSpinner';

interface UserDocument {
  id: string;
  user_id: string;
  type: string;
  status: 'pending' | 'verified' | 'rejected';
  url: string;
  created_at: string;
  updated_at: string;
  user: {
    name: string;
    email: string;
  };
}

export default function UserDocuments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [isViewingDocument, setIsViewingDocument] = useState(false);
  const [isConfirmModal, setIsConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'verify' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('seller_documents')
        .select(`
          *,
          user:user_id (
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
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (action: 'verify' | 'reject') => {
    if (!selectedDocument) return;

    try {
      setActionError(null);

      const { error: updateError } = await supabase
        .from('seller_documents')
        .update({ 
          status: action === 'verify' ? 'verified' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDocument.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.rpc('log_system_event', {
        p_level: action === 'verify' ? 'info' : 'warn',
        p_category: 'admin',
        p_message: `Document ${selectedDocument.id} ${action}ed`,
        p_metadata: {
          user_id: selectedDocument.user_id,
          document_type: selectedDocument.type
        }
      });

      setIsConfirmModal(false);
      setConfirmAction(null);
      loadDocuments();
    } catch (err) {
      console.error('Error updating document status:', err);
      setActionError(err instanceof Error ? err.message : 'Error updating document status');
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Documentos</h1>
        <p className="text-gray-400">
          Gerencie os documentos enviados pelos usuários
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
            {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
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
                {status === 'verified' && 'Verificados'}
                {status === 'rejected' && 'Rejeitados'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Data de envio</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-800">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{doc.user.name}</div>
                      <div className="text-xs text-gray-500">{doc.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {doc.type === 'selfie' && 'Selfie com documento'}
                    {doc.type === 'identity' && 'RG/CNH'}
                    {doc.type === 'address' && 'Comprovante de endereço'}
                    {doc.type === 'social_contract' && 'Contrato Social'}
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4">
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setIsViewingDocument(true);
                        }}
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Ver documento"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-800 rounded"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                      {doc.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setConfirmAction('verify');
                              setIsConfirmModal(true);
                            }}
                            className="p-1 hover:bg-gray-800 rounded"
                            title="Verificar"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setConfirmAction('reject');
                              setIsConfirmModal(true);
                            }}
                            className="p-1 hover:bg-gray-800 rounded"
                            title="Rejeitar"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum documento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {isViewingDocument && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                Visualizar Documento
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Usuário
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="font-medium text-white">{selectedDocument.user.name}</div>
                    <div className="text-sm text-gray-400">{selectedDocument.user.email}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Tipo de documento
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3 text-white">
                    {selectedDocument.type === 'selfie' && 'Selfie com documento'}
                    {selectedDocument.type === 'identity' && 'RG/CNH'}
                    {selectedDocument.type === 'address' && 'Comprovante de endereço'}
                    {selectedDocument.type === 'social_contract' && 'Contrato Social'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Documento
                  </label>
                  <div className="relative aspect-video">
                    <img
                      src={selectedDocument.url}
                      alt="Document"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsViewingDocument(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Fechar
              </button>
              {selectedDocument.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setIsViewingDocument(false);
                      setConfirmAction('reject');
                      setIsConfirmModal(true);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => {
                      setIsViewingDocument(false);
                      setConfirmAction('verify');
                      setIsConfirmModal(true);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Verificar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {isConfirmModal && selectedDocument && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                {confirmAction === 'verify' && (
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
                {confirmAction === 'verify' ? 'Verificar documento' : 'Rejeitar documento'}
              </h3>

              <p className="text-gray-400 text-center mb-6">
                {confirmAction === 'verify'
                  ? 'Tem certeza que deseja verificar este documento?'
                  : 'Tem certeza que deseja rejeitar este documento?'}
              </p>

              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="font-medium text-white">{selectedDocument.user.name}</div>
                <div className="text-sm text-gray-400">{selectedDocument.user.email}</div>
                <div className="text-sm text-gray-400 mt-2">
                  {selectedDocument.type === 'selfie' && 'Selfie com documento'}
                  {selectedDocument.type === 'identity' && 'RG/CNH'}
                  {selectedDocument.type === 'address' && 'Comprovante de endereço'}
                  {selectedDocument.type === 'social_contract' && 'Contrato Social'}
                </div>
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
                  confirmAction === 'verify'
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