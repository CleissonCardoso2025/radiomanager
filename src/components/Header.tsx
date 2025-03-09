import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Menu, Search, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/App';

interface HeaderProps {
  notificationCount?: number;
}

interface Notification {
  id: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'sucesso';
  created_at: string;
}

const Header: React.FC<HeaderProps> = ({ notificationCount: propNotificationCount }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(propNotificationCount || 0);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchNotifications();
    }
    
    // Carregar o logo personalizado do localStorage
    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
  }, [userRole]);

  const fetchNotifications = async () => {
    try {
      // Buscar testemunhais pendentes para notificações
      const { data: testemunhaisPendentes, error: errorPendentes } = await supabase
        .from('testemunhais')
        .select('id, texto, horario_agendado, status, programas(nome)')
        .eq('status', 'pendente')
        .order('horario_agendado', { ascending: true });
      
      // Buscar testemunhais lidos recentemente para notificações de sucesso
      const { data: testemunhaisLidos, error: errorLidos } = await supabase
        .from('testemunhais')
        .select('id, texto, horario_agendado, status, programas(nome)')
        .eq('status', 'lido')
        .order('updated_at', { ascending: false })
        .limit(3);
      
      if (errorPendentes || errorLidos) {
        console.error('Erro ao buscar notificações:', errorPendentes || errorLidos);
        return;
      }
      
      const pendentesFormatados = testemunhaisPendentes?.map(item => ({
        id: item.id,
        titulo: 'Testemunhal Pendente',
        descricao: `${item.programas?.nome} - ${item.horario_agendado?.substring(0, 5)}`,
        status: 'pendente' as const,
        created_at: new Date().toISOString()
      })) || [];
      
      const lidosFormatados = testemunhaisLidos?.map(item => ({
        id: item.id,
        titulo: 'Leitura Confirmada',
        descricao: `${item.programas?.nome} - ${item.horario_agendado?.substring(0, 5)}`,
        status: 'sucesso' as const,
        created_at: new Date().toISOString()
      })) || [];
      
      const todasNotificacoes = [...pendentesFormatados, ...lidosFormatados];
      setNotifications(todasNotificacoes);
      setNotificationCount(pendentesFormatados.length);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const pendingIds = notifications
        .filter(n => n.status === 'pendente')
        .map(n => n.id);
      
      if (pendingIds.length > 0) {
        const { error } = await supabase
          .from('testemunhais')
          .update({ status: 'lido' })
          .in('id', pendingIds);
        
        if (error) {
          console.error('Erro ao marcar notificações como lidas:', error);
          return;
        }
        
        // Atualizar notificações localmente
        setNotifications(prev => 
          prev.map(n => 
            n.status === 'pendente' 
              ? { ...n, status: 'sucesso', titulo: 'Leitura Confirmada' } 
              : n
          )
        );
        setNotificationCount(0);
      }
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Define todos os itens de navegação
  const allNavItems = [
    { name: 'Dashboard', path: '/', isActive: location.pathname === '/', requiredRole: 'admin' },
    { name: 'Programas e Testemunhais', path: '/gerenciamento', isActive: location.pathname === '/gerenciamento', requiredRole: 'admin' },
    { name: 'Agenda', path: '/agenda', isActive: location.pathname === '/agenda', requiredRole: 'any' },
    { name: 'Relatórios', path: '/relatorios', isActive: location.pathname === '/relatorios', requiredRole: 'admin' },
  ];

  // Filtra os itens de navegação com base no papel do usuário
  const navItems = allNavItems.filter(item => {
    if (item.requiredRole === 'admin') {
      return userRole === 'admin';
    }
    return true; // Itens com requiredRole 'any' são mostrados para todos
  });

  // Define todos os itens do menu do usuário
  const allUserMenuItems = [
    { 
      label: 'Meu Perfil',
      onClick: () => navigate('/perfil'),
      requiredRole: 'any'
    },
    { 
      label: 'Configurações',
      onClick: () => navigate('/configuracoes'),
      requiredRole: 'admin'
    },
    { 
      label: 'Sair',
      onClick: handleLogout,
      requiredRole: 'any'
    },
  ];

  // Filtra os itens do menu do usuário com base no papel do usuário
  const userMenuItems = allUserMenuItems.filter(item => {
    if (item.requiredRole === 'admin') {
      return userRole === 'admin';
    }
    return true; // Itens com requiredRole 'any' são mostrados para todos
  });

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="container px-6 h-16 mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center">
            <Link to="/">
              {customLogo ? (
                <img 
                  src={customLogo} 
                  alt="Logo" 
                  className="h-8 max-w-[180px] object-contain" 
                />
              ) : (
                <h1 className="text-2xl font-medium text-primary tracking-tight">
                  RadioManager
                </h1>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-item ${item.isActive ? 'nav-item-active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100 transition-all"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </Button>

          {/* Search input (animated) */}
          <div
            className={`absolute right-28 transition-all duration-300 ease-in-out overflow-hidden ${
              isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="input-search pl-10"
              />
            </div>
          </div>

          {/* Notifications - Apenas para administradores */}
          {userRole === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100 transition-all relative"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 p-0 bg-primary text-white text-xs animate-ping-slow">
                      {notificationCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Notificações</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Marcar todas como lidas
                  </Button>
                </div>
                <DropdownMenuSeparator />
                <div className="space-y-2 my-2">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        title={notification.titulo}
                        description={notification.descricao}
                        status={notification.status}
                      />
                    ))
                  ) : (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      Nenhuma notificação
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <Button 
                  variant="outline" 
                  className="w-full mt-2 text-sm"
                  onClick={() => navigate('/relatorios')}
                >
                  Ver todas
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full gap-2 hover:bg-gray-100">
                <User size={20} />
                <span className="hidden sm:inline-block font-normal">
                  {userRole === 'admin' ? 'Admin' : 'Locutor'}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col p-2 gap-1">
                {userMenuItems.map((item) => (
                  <DropdownMenuItem 
                    key={item.label} 
                    className="cursor-pointer"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de Navegação</SheetTitle>
                </SheetHeader>
                <div className="pt-16 px-6 flex flex-col gap-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`p-4 rounded-lg flex items-center ${
                        item.isActive
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

interface NotificationItemProps {
  title: string;
  description: string;
  status: 'pendente' | 'sucesso';
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  description,
  status,
}) => {
  return (
    <div className="flex items-start p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
      <div className="flex-grow">
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Badge
        variant="outline"
        className={`ml-2 ${
          status === 'pendente'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
            : 'bg-green-100 text-green-800 border-green-200'
        }`}
      >
        {status === 'pendente' ? 'Pendente' : 'Concluído'}
      </Badge>
    </div>
  );
};

export default Header;
