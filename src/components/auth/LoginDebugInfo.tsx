
import React, { useState, useEffect } from 'react';
import { SUPABASE_URL } from '@/integrations/supabase/core/client';

interface LoginDebugInfoProps {
  debugInfo: string;
  isOnline: boolean;
}

const LoginDebugInfo: React.FC<LoginDebugInfoProps> = ({ debugInfo, isOnline }) => {
  // Estado para controlar a exibição do botão de configuração
  const [showConfigButton, setShowConfigButton] = useState(false);
  
  // Verificar se as credenciais estão configuradas ao carregar o componente
  useEffect(() => {
    const keyExists = !!localStorage.getItem('supabase_anon_key');
    const urlExists = !!localStorage.getItem('supabase_url');
    const configComplete = keyExists && urlExists;
    
    // Mostrar o botão apenas se a configuração estiver incompleta
    setShowConfigButton(!configComplete);
  }, []);
  
  // Exibir informações de debug apenas no modo de desenvolvimento
  if (process.env.NODE_ENV === 'production' && !debugInfo && !showConfigButton) {
    return null;
  }
  
  const handleSetApiKeys = () => {
    try {
      // Mostrar configuração atual
      const currentUrl = localStorage.getItem('supabase_url') || SUPABASE_URL;
      const currentKey = localStorage.getItem('supabase_anon_key') || '';
      const keyPreview = currentKey ? `${currentKey.substring(0, 10)}...` : '(não definido)';
      
      // Solicitar novos valores
      const newUrl = prompt('Digite a URL do Supabase (ex: https://xyz123.supabase.co):', currentUrl);
      
      if (newUrl) {
        if (!newUrl.startsWith('https://') || !newUrl.includes('supabase.co')) {
          alert('URL do Supabase inválida! Certifique-se de incluir https:// e terminar com .supabase.co');
          return;
        }
        localStorage.setItem('supabase_url', newUrl);
      }
      
      const newKey = prompt('Digite a chave anônima do Supabase (começa com "ey..."):', currentKey);
      if (newKey) {
        if (!newKey.startsWith('ey')) {
          alert('Chave anônima inválida! Deve começar com "ey"');
          return;
        }
        localStorage.setItem('supabase_anon_key', newKey);
      }
      
      if ((newUrl && newUrl !== currentUrl) || (newKey && newKey !== currentKey)) {
        // Se a configuração foi alterada, ocultar o botão e recarregar a página
        setShowConfigButton(false);
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
  const urlExists = !!localStorage.getItem('supabase_url');
  const configComplete = keyExists && urlExists;
  
  return (
    <div className="text-xs text-gray-500 text-center mt-2 p-2 bg-gray-100 rounded-md">
      <div>
        <span className="font-semibold">Status da Conexão:</span> {isOnline ? 'Online' : 'Offline'}
      </div>
      {debugInfo && (
        <div className="mt-1 font-mono">
          {debugInfo}
        </div>
      )}
      {(!configComplete && showConfigButton) && (
        <div className="mt-1 text-red-500 font-semibold">
          Configuração do Supabase incompleta!
        </div>
      )}
      {showConfigButton && (
        <button 
          onClick={handleSetApiKeys}
          className="mt-2 text-blue-500 underline text-xs"
        >
          Configurar Supabase
        </button>
      )}
    </div>
  );
};

export default LoginDebugInfo;
