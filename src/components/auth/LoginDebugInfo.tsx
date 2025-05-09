
import React from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';

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
      alert("API keys are now hardcoded in the repository as requested. To change them, update the values in src/integrations/supabase/core/client.ts");
    } catch (error) {
      console.error("Erro ao exibir mensagem:", error);
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
      <div className="mt-1">
        <span className="font-semibold">Valores hardcoded:</span>
        <div>URL: {SUPABASE_URL}</div>
        <div>Key: {SUPABASE_ANON_KEY.substring(0, 10)}...</div>
      </div>
      <button 
        onClick={handleSetApiKeys}
        className="mt-2 text-blue-500 underline text-xs"
      >
        Informações sobre as chaves do Supabase
      </button>
    </div>
  );
};

export default LoginDebugInfo;
