
import React from 'react';
import { SUPABASE_URL } from '@/integrations/supabase/core/client';

interface LoginDebugInfoProps {
  debugInfo: string;
  isOnline: boolean;
}

const LoginDebugInfo: React.FC<LoginDebugInfoProps> = ({ debugInfo, isOnline }) => {
  // Exibir informações de debug apenas no modo de desenvolvimento
  if (process.env.NODE_ENV === 'production' || !debugInfo) {
    return null;
  }
  
  const handleSetApiKeys = () => {
    try {
      // Mostrar configuração atual
      const currentUrl = localStorage.getItem('supabase_url') || SUPABASE_URL;
      const currentKey = localStorage.getItem('supabase_anon_key') || '';
      const keyPreview = currentKey ? `${currentKey.substring(0, 10)}...` : '(não definido)';
      
      // Solicitar novos valores
      const newUrl = prompt('Digite a URL do Supabase:', currentUrl);
      if (newUrl) {
        localStorage.setItem('supabase_url', newUrl);
      }
      
      const newKey = prompt('Digite a chave anônima do Supabase:', currentKey);
      if (newKey) {
        localStorage.setItem('supabase_anon_key', newKey);
      }
      
      if ((newUrl && newUrl !== currentUrl) || (newKey && newKey !== currentKey)) {
        alert('Configuração atualizada! A página será recarregada.');
        window.location.reload();
      } else {
        alert('Nenhuma alteração feita.');
      }
    } catch (error) {
      console.error("Erro ao configurar chaves:", error);
      alert("Erro ao configurar chaves: " + String(error));
    }
  }
  
  // Verificar se a chave já está configurada
  const keyExists = !!localStorage.getItem('supabase_anon_key');
  
  return (
    <div className="text-xs text-gray-500 text-center mt-2 p-2 bg-gray-100 rounded-md">
      <div>
        <span className="font-semibold">Status da Conexão:</span> {isOnline ? 'Online' : 'Offline'}
      </div>
      <div className="mt-1 font-mono">
        {debugInfo}
      </div>
      {!keyExists && (
        <div className="mt-1 text-red-500 font-semibold">
          A chave do Supabase não está configurada!
        </div>
      )}
      <button 
        onClick={handleSetApiKeys}
        className="mt-2 text-blue-500 underline text-xs"
      >
        Configurar chaves do Supabase
      </button>
    </div>
  );
};

export default LoginDebugInfo;
