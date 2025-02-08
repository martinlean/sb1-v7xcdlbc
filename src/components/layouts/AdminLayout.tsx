import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Users,
  UserPlus,
  Package,
  Settings,
  Link2,
  ChevronDown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  HelpCircle,
  Share2,
  Wallet,
  UserCog,
  ShieldCheck,
  Building2,
  BarChart3,
  Mail,
  AlertCircle,
  UserCheck,
  DollarSign,
  FileSearch,
  Briefcase,
  Globe,
  Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = 'https://admin.rewardsmidia.online/login';
        return;
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('admin_access, status')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking admin access:', profileError);
        await supabase.auth.signOut();
        window.location.href = 'https://admin.rewardsmidia.online/login';
        return;
      }

      if (!profile?.admin_access || profile.status !== 'active') {
        // Not an admin or inactive, redirect to app
        await supabase.auth.signOut();
        window.location.href = 'https://app.rewardsmidia.online';
        return;
      }

      // Set user name
      setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin');
    } catch (err) {
      console.error('Error checking admin access:', err);
      await supabase.auth.signOut();
      window.location.href = 'https://admin.rewardsmidia.online/login';
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = 'https://admin.rewardsmidia.online/login';
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback redirect
      window.location.href = 'https://admin.rewardsmidia.online/login';
    }
  };

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => 
      prev.includes(menu) 
        ? prev.filter(item => item !== menu)
        : [...prev, menu]
    );
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsHovering(true);
      setIsSidebarOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovering(false);
      setIsSidebarOpen(false);
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsSidebarOpen(true);
    }
  };

  const menuItems = [
    { 
      icon: <LayoutDashboard size={20} />, 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    {
      icon: <Users size={20} />,
      label: 'Usuários',
      submenu: [
        { label: 'Todos os usuários', path: '/users' },
        { label: 'Verificações pendentes', path: '/users/pending' },
        { label: 'Documentos', path: '/users/documents' }
      ]
    },
    {
      icon: <ShoppingCart size={20} />,
      label: 'Vendas',
      submenu: [
        { label: 'Transações', path: '/transactions' },
        { label: 'Reembolsos', path: '/refunds' }
      ]
    },
    {
      icon: <Wallet size={20} />,
      label: 'Financeiro',
      submenu: [
        { label: 'Saques pendentes', path: '/withdrawals' },
        { label: 'Histórico de saques', path: '/withdrawals/history' },
        { label: 'Configurações de pagamento', path: '/withdrawals/settings' }
      ]
    },
    {
      icon: <Package size={20} />,
      label: 'Produtos',
      submenu: [
        { label: 'Todos os produtos', path: '/products' },
        { label: 'Categorias', path: '/products/categories' },
        { label: 'Denúncias', path: '/products/reports' }
      ]
    },
    {
      icon: <UserPlus size={20} />,
      label: 'Afiliados',
      submenu: [
        { label: 'Programas', path: '/affiliates/programs' },
        { label: 'Comissões', path: '/affiliates/commissions' },
        { label: 'Configurações', path: '/affiliates/settings' }
      ]
    },
    {
      icon: <Building2 size={20} />,
      label: 'Empresas',
      submenu: [
        { label: 'Todas as empresas', path: '/companies' },
        { label: 'Documentos pendentes', path: '/companies/documents' },
        { label: 'Configurações', path: '/companies/settings' }
      ]
    },
    {
      icon: <ShieldCheck size={20} />,
      label: 'Segurança',
      submenu: [
        { label: 'Logs do sistema', path: '/security/logs' },
        { label: 'Tentativas de fraude', path: '/security/fraud' },
        { label: 'Configurações', path: '/security/settings' }
      ]
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Relatórios',
      submenu: [
        { label: 'Vendas', path: '/reports/sales' },
        { label: 'Usuários', path: '/reports/users' },
        { label: 'Financeiro', path: '/reports/financial' }
      ]
    },
    {
      icon: <Settings size={20} />,
      label: 'Configurações',
      submenu: [
        { label: 'Geral', path: '/settings/general' },
        { label: 'Pagamentos', path: '/settings/payments' },
        { label: 'Emails', path: '/settings/emails' },
        { label: 'Integrações', path: '/settings/integrations' }
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-16'}
          ${isHovering ? 'w-64' : ''}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-[#0A0A0A] border-r border-gray-800">
          <div className={`mb-8 px-2 flex items-center justify-between transition-all duration-300 ${!isSidebarOpen && !isHovering ? 'justify-center' : ''}`}>
            <img src="/logo.svg" alt="Logo" className="h-8" />
            {(isSidebarOpen || isHovering) && (
              <button
                onClick={togglePin}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {isPinned ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
          </div>

          <nav className="space-y-1">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`
                        flex items-center justify-between w-full px-2 py-2 text-sm rounded-lg
                        hover:bg-gray-800 transition-colors
                        ${!isSidebarOpen && !isHovering ? 'justify-center' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {(isSidebarOpen || isHovering) && <span>{item.label}</span>}
                      </div>
                      {(isSidebarOpen || isHovering) && (
                        <ChevronDown
                          size={16}
                          className={`transform transition-transform ${
                            openMenus.includes(item.label) ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>
                    {(isSidebarOpen || isHovering) && openMenus.includes(item.label) && (
                      <div className="ml-9 mt-1 space-y-1">
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className={`
                              block px-2 py-1.5 text-sm rounded-lg
                              ${isActive(subItem.path)
                                ? 'bg-[#00A3FF] text-white'
                                : 'text-gray-400 hover:bg-gray-800'
                              }
                            `}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-2 py-2 text-sm rounded-lg
                      ${!isSidebarOpen && !isHovering ? 'justify-center' : ''}
                      ${isActive(item.path)
                        ? 'bg-[#00A3FF] text-white'
                        : 'text-gray-400 hover:bg-gray-800'
                      }
                    `}
                  >
                    {item.icon}
                    {(isSidebarOpen || isHovering) && <span>{item.label}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className={`
        transition-all duration-300
        ${isSidebarOpen ? 'pl-64' : 'pl-16'}
      `}>
        <header className="bg-[#0A0A0A] border-b border-gray-800 h-16 fixed top-0 right-0 left-0 z-30">
          <div className={`
            flex items-center justify-end h-full px-4
            transition-all duration-300
            ${isSidebarOpen ? 'pl-64' : 'pl-16'}
          `}>
            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              >
                <User size={20} />
                <span>{userName}</span>
                <ChevronDown size={16} className={`transform transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-800 py-1">
                  <Link to="/settings/profile" className="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-800">
                    Meu Perfil
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-800"
                  >
                    Desconectar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="pt-16 min-h-screen bg-[#0A0A0A]">
          {children}
        </main>
      </div>
    </div>
  );
}