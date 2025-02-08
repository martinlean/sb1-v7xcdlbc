import React, { useState } from 'react';
import { Download, Image, FileText, Video, Copy, ExternalLink } from 'lucide-react';
import AppLayout from '../../components/layouts/AppLayout';
import { useAffiliates } from '../../hooks/useAffiliates';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Resource {
  id: string;
  type: 'image' | 'video' | 'document';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  size?: string;
  format?: string;
}

export default function AppAffiliateResources() {
  const { getAffiliateResources, loading, error } = useAffiliates();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Materiais Promocionais</h1>
          <p className="text-gray-400">
            Acesse banners, vídeos e textos prontos para suas campanhas
          </p>
        </div>

        {/* Product Selector */}
        <div className="mb-6">
          <select
            value={selectedProduct || ''}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5"
          >
            <option value="">Selecione um produto</option>
            {/* Add product options dynamically */}
          </select>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Banners Section */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Banners</h2>
            </div>
            
            <div className="space-y-4">
              {resources
                .filter(r => r.type === 'image')
                .map(resource => (
                  <div key={resource.id} className="group relative">
                    <img
                      src={resource.thumbnail || resource.url}
                      alt={resource.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCopy(resource.url, resource.id)}
                        className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800"
                        title="Copiar URL"
                      >
                        <Copy className="w-4 h-4 text-white" />
                      </button>
                      <a
                        href={resource.url}
                        download
                        className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Videos Section */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Vídeos</h2>
            </div>
            
            <div className="space-y-4">
              {resources
                .filter(r => r.type === 'video')
                .map(resource => (
                  <div key={resource.id} className="group relative">
                    <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      {resource.thumbnail ? (
                        <img
                          src={resource.thumbnail}
                          alt={resource.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-white">{resource.title}</h3>
                      <p className="text-xs text-gray-400">{resource.description}</p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleCopy(resource.url, resource.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 hover:bg-gray-700"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar URL
                      </button>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 hover:bg-gray-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Abrir
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">Textos e Documentos</h2>
            </div>
            
            <div className="space-y-4">
              {resources
                .filter(r => r.type === 'document')
                .map(resource => (
                  <div key={resource.id} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">
                          {resource.title}
                        </h3>
                        <p className="text-xs text-gray-400">{resource.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span>{resource.format}</span>
                          <span>•</span>
                          <span>{resource.size}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(resource.url, resource.id)}
                          className="p-1 hover:bg-gray-700 rounded"
                          title="Copiar URL"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                        <a
                          href={resource.url}
                          download
                          className="p-1 hover:bg-gray-700 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Copy Feedback */}
        {copiedId && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            URL copiada com sucesso!
          </div>
        )}
      </div>
    </AppLayout>
  );
}