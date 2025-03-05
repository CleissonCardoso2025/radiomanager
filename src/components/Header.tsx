
import React, { useState } from 'react';
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
} from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  notificationCount: number;
}

const Header: React.FC<HeaderProps> = ({ notificationCount }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', isActive: location.pathname === '/' },
    { name: 'Programas e Testemunhais', path: '/gerenciamento', isActive: location.pathname === '/gerenciamento' },
    { name: 'Agenda', path: '/agenda', isActive: location.pathname === '/agenda' },
    { name: 'Relatórios', path: '#', isActive: false },
  ];

  const userMenuItems = [
    { label: 'Meu Perfil' },
    { label: 'Configurações' },
    { label: 'Sair' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="container px-6 h-16 mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center">
            <Link to="/">
              <h1 className="text-2xl font-medium text-primary tracking-tight">
                RadioManager
              </h1>
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

          {/* Notifications */}
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
                <Button variant="ghost" size="sm" className="text-xs">
                  Marcar todas como lidas
                </Button>
              </div>
              <DropdownMenuSeparator />
              <div className="space-y-2 my-2">
                <NotificationItem
                  title="Testemunhal Pendente"
                  description="Programa Manhã Total - 10:30"
                  status="pendente"
                />
                <NotificationItem
                  title="Leitura Confirmada"
                  description="Programa Tarde Show - 14:15"
                  status="sucesso"
                />
              </div>
              <DropdownMenuSeparator />
              <Button variant="outline" className="w-full mt-2 text-sm">
                Ver todas
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full gap-2 hover:bg-gray-100">
                <User size={20} />
                <span className="hidden sm:inline-block font-normal">Admin</span>
                <ChevronDown size={16} className="text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col p-2 gap-1">
                {userMenuItems.map((item) => (
                  <DropdownMenuItem key={item.label} className="cursor-pointer">
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
