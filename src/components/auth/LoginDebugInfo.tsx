
import React from 'react';

interface LoginDebugInfoProps {
  debugInfo: string;
  isOnline: boolean;
}

const LoginDebugInfo: React.FC<LoginDebugInfoProps> = ({ debugInfo, isOnline }) => {
  // Only show debug info in development mode
  if (process.env.NODE_ENV === 'production' || !debugInfo) {
    return null;
  }
  
  const handleSetApiKeys = () => {
    try {
      const newUrl = prompt("Informe a URL do Supabase:", localStorage.getItem('supabase_url') || "");
      const newKey = prompt("Informe a chave anônima do Supabase:", localStorage.getItem('supabase_anon_key') || "");
      
      if (newUrl) localStorage.setItem('supabase_url', newUrl);
      if (newKey) localStorage.setItem('supabase_anon_key', newKey);
      
      alert("Configurações salvas! Recarregue a página para aplicar as alterações.");
      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações. Verifique o console para mais detalhes.");
    }
  }
  
  return (
    <div className="text-xs text-gray-500 text-center mt-2 p-2 bg-gray-100 rounded-md">
      <div>
        <span className="font-semibold">Status da Conexão:</span> {isOnline ? 'Online' : 'Offline'}
      </div>
      <div className="mt-1 font-mono">
        {debugInfo}
      </div>
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
