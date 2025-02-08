import React, { useState } from 'react';
import { 
  Webhook, 
  Bot, 
  BarChart3, 
  Users, 
  FileText, 
  MoreHorizontal,
  Wrench,
  Mail,
  MessageSquare,
  Link
} from 'lucide-react';
import AppLayout from '../components/layouts/AppLayout';
import UTMifyDrawer from '../components/UTMifyDrawer';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode | string;
  category: string;
  status?: 'soon' | 'active';
  url?: string;
}

const integrations: Integration[] = [
  // Automação
  {
    id: 'api',
    name: 'API',
    description: 'Faça integrações diretamente com a nossa API',
    icon: <Wrench className="w-8 h-8" />,
    category: 'automation',
    status: 'active'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Integre com sistemas externos através de webhooks',
    icon: <Webhook className="w-8 h-8" />,
    category: 'automation',
    status: 'active'
  },
  
  // Tracking
  {
    id: 'utmify',
    name: 'UTMify',
    description: 'Faça o rastreamento de campanhas de marketing',
    icon: <img src="../app/imagens/utmify.webp" alt="UTMify" className="w-8 h-8" />,
    category: 'tracking',
    status: 'active'
  },
  {
    id: 'nemu',
    name: 'Nemu',
    description: 'Faça o rastreamento de campanhas de marketing',
    icon: <BarChart3 className="w-8 h-8" />,
    category: 'tracking',
    status: 'soon'
  },

  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Crie automações de e-mail marketing',
    icon: <Mail className="w-8 h-8" />,
    category: 'marketing',
    status: 'soon'
  },
  {
    id: 'reportana',
    name: 'Reportana',
    description: 'Automatize o seu marketing digital',
    icon: <BarChart3 className="w-8 h-8" />,
    category: 'marketing',
    status: 'soon'
  },

  // Membership
  {
    id: 'sellflux',
    name: 'SellFlux',
    description: 'Automatize o seu marketing digital',
    icon: <Bot className="w-8 h-8" />,
    category: 'membership',
    status: 'soon'
  },
  {
    id: 'voxuy',
    name: 'Voxuy',
    description: 'Crie fluxos de mensagens para o WhatsApp',
    icon: <MessageSquare className="w-8 h-8" />,
    category: 'membership',
    status: 'soon'
  }
];

const categories = [
  { id: 'automation', label: 'Automação', icon: <Bot className="w-4 h-4" /> },
  { id: 'tracking', label: 'Traqueamento', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'marketing', label: 'Marketing', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'membership', label: 'Área de Membros', icon: <Users className="w-4 h-4" /> },
  { id: 'invoices', label: 'Notas fiscais', icon: <FileText className="w-4 h-4" /> },
  { id: 'others', label: 'Outros', icon: <MoreHorizontal className="w-4 h-4" /> }
];

export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState('automation');
  const [isUTMifyOpen, setIsUTMifyOpen] = useState(false);

  const filteredIntegrations = integrations.filter(
    integration => integration.category === selectedCategory
  );

  const handleIntegrationClick = (integration: Integration) => {
    if (integration.id === 'utmify') {
      setIsUTMifyOpen(true);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Integrações</h1>
          <p className="text-gray-400">
            Integre sua conta com outras ferramentas e aumente a eficiência do seu negócio.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                ${selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => (
            <div
              key={integration.id}
              className={`
                relative bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors
                ${integration.status === 'soon' ? 'opacity-75' : ''}
              `}
            >
              {integration.status === 'soon' && (
                <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-gray-800 text-gray-400 rounded">
                  Em breve
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-800 rounded-lg">
                  {typeof integration.icon === 'string' ? (
                    <img src={integration.icon} alt={integration.name} className="w-8 h-8" />
                  ) : (
                    integration.icon
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-1">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {integration.description}
                  </p>
                </div>
              </div>

              {integration.status !== 'soon' && (
                <button
                  onClick={() => handleIntegrationClick(integration)}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Link className="w-4 h-4" />
                  Conectar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* UTMify Drawer */}
        <UTMifyDrawer 
          isOpen={isUTMifyOpen}
          onClose={() => setIsUTMifyOpen(false)}
        />
      </div>
    </AppLayout>
  );
}