
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
  
  return (
    <div className="text-xs text-gray-500 text-center mt-2 p-2 bg-gray-100 rounded-md">
      <div>
        <span className="font-semibold">Status da Conexão:</span> {isOnline ? 'Online' : 'Offline'}
      </div>
      <div className="mt-1 font-mono">
        {debugInfo}
      </div>
    </div>
  );
};

export default LoginDebugInfo;
