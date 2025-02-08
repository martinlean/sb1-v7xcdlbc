import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Share2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = 'https://app.rewardsmidia.online/login';
        return;
      }

      // Check if user has a seller profile
      const { data: profile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('status, admin_access')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile check error:', profileError);
        await supabase.auth.signOut();
        window.location.href = 'https://app.rewardsmidia.online/login';
        return;
      }

      // If user is an admin, redirect to admin panel
      if (profile?.admin_access) {
        window.location.href = 'https://admin.rewardsmidia.online';
        return;
      }

      // If account is not active
      if (profile?.status !== 'active') {
        await supabase.auth.signOut();
        window.location.href = 'https://app.rewardsmidia.online/login';
        return;
      }

      // Set user name
      setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User');
    } catch (err) {
      console.error('Session check error:', err);
      await supabase.auth.signOut();
      window.location.href = 'https://app.rewardsmidia.online/login';
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = 'https://app.rewardsmidia.online/login';
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback redirect
      window.location.href = 'https://app.rewardsmidia.online/login';
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
      icon: <ShoppingCart size={20} />,
      label: 'Vendas',
      submenu: [
        { label: 'Transações', path: '/transactions' }
      ]
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Financeiro',
      submenu: [
        { label: 'Saques', path: '/withdrawals' },
        { label: 'Reembolsos', path: '/refunds' },
        { label: 'Conta bancária', path: '/bank-account' },
        { label: 'Minhas taxas', path: '/fees' }
      ]
    },
    { 
      icon: <Users size={20} />, 
      label: 'Clientes', 
      path: '/customers' 
    },
    { 
      icon: <UserPlus size={20} />, 
      label: 'Afiliados', 
      path: '/affiliates' 
    },
    {
      icon: <Package size={20} />,
      label: 'Produtos',
      submenu: [
        { label: 'Meus produtos', path: '/products' },
        { label: 'Minhas afiliações', path: '/products/affiliations' },
        { label: 'Minhas co-produções', path: '/products/co-productions' }
      ]
    },
    {
      icon: <Settings size={20} />,
      label: 'Configurações',
      submenu: [
        { label: 'Perfil', path: '/settings/profile' },
        { label: 'Meus documentos', path: '/settings/documents' }
      ]
    },
    { 
      icon: <Link2 size={20} />, 
      label: 'Integrações', 
      path: '/integrations',
      className: 'text-white' // Add this to make it white like other active items
    },
    { 
      icon: <Share2 size={20} />, 
      label: 'Indique e ganhe', 
      path: '/referrals' 
    },
    { 
      icon: <HelpCircle size={20} />, 
      label: 'Fale com o suporte', 
      path: '/support' 
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
                className="p-1 hover:bg-gray-800 rounded-lg"
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
                        : item.className || 'text-gray-400 hover:bg-gray-800'
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