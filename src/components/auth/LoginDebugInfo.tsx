
import React from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, testConnection } from '@/integrations/supabase/core/client';

interface LoginDebugInfoProps {
  debugInfo: string;
  isOnline: boolean;
}

const LoginDebugInfo: React.FC<LoginDebugInfoProps> = ({ debugInfo, isOnline }) => {
  // Apenas mostrar informações de debug em modo de desenvolvimento
  if (process.env.NODE_ENV === 'production' || !debugInfo) {
    return null;
  }
  
  const handleSetApiKeys = () => {
    try {
      // Solicitar novas chaves do usuário
      const newUrl = prompt('Informe a URL do Supabase:', localStorage.getItem('supabase_url') || '');
      if (newUrl === null) return; // Usuário cancelou
      
      const newKey = prompt('Informe a Chave Anônima do Supabase:', '');
      if (newKey === null) return; // Usuário cancelou
      
      // Salvar no localStorage
      localStorage.setItem('supabase_url', newUrl);
      localStorage.setItem('supabase_anon_key', newKey);
      
      // Mostrar confirmação
      alert('Chaves do Supabase atualizadas! A página será recarregada para aplicar as mudanças.');
      
      // Recarregar a página para aplicar novas configurações
      window.location.reload();
    } catch (error) {
      console.error("Erro ao configurar chaves:", error);
    }
  }
  
  const checkConnection = async () => {
    const isConnected = await testConnection();
    alert(isConnected 
      ? 'Conexão com Supabase bem-sucedida!' 
      : 'Erro ao conectar com o Supabase. Verifique as chaves informadas.');
  }
  
  return (
    <div className="text-xs text-gray-500 text-center mt-2 p-2 bg-gray-100 rounded-md">
      <div>
        <span className="font-semibold">Status da Conexão:</span> {isOnline ? 'Online' : 'Offline'}
      </div>
      <div className="mt-1 font-mono">
        {debugInfo}
      </div>
      <div className="flex flex-col space-y-2 mt-2">
        <button 
          onClick={handleSetApiKeys}
          className="text-blue-500 underline text-xs"
        >
          Configurar chaves do Supabase
        </button>
        <button 
          onClick={checkConnection}
          className="text-blue-500 underline text-xs"
        >
          Testar conexão
        </button>
      </div>
    </div>
  );
};

export default LoginDebugInfo;
