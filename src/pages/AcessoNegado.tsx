
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AcessoNegado = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <ShieldAlert size={80} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-gray-600 mb-2">
          Você não tem permissão para acessar esta página.
        </p>
        <p className="text-gray-500 mb-8">
          Seu nível de acesso atual <span className="font-semibold">({userRole === 'admin' ? 'Administrador' : 'Locutor'})</span> não permite visualizar este conteúdo.
        </p>
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/agenda')}
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Ir para Agenda
          </Button>
          <Button 
            onClick={() => navigate('/perfil')}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <UserCircle size={16} />
            Ver meu Perfil
          </Button>
          <Button 
            onClick={() => navigate('/login')}
            variant="ghost"
            className="w-full"
          >
            Voltar para Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AcessoNegado;
