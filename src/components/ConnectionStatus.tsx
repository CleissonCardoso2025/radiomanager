import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  isOnline: boolean;
  connectionError?: boolean;
  retryCount?: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isOnline, 
  connectionError = false,
  retryCount = 0 
}) => {
  const [isVisible, setIsVisible] = useState(!isOnline || connectionError);
  
  // Esconder o componente após 5 segundos se estiver online e sem erros
  useEffect(() => {
    if (isOnline && !connectionError) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isOnline, connectionError]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300",
        isOnline && !connectionError
          ? "bg-gradient-to-r from-green-100/90 to-green-50/90 text-green-800 border border-green-200" 
          : "bg-gradient-to-r from-red-100/90 to-red-50/90 text-red-800 border border-red-200"
      )}
    >
      {isOnline && !connectionError ? (
        <>
          <Wifi size={18} className="text-green-600" />
          <span className="font-semibold">Conectado</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-green-700 hover:bg-green-200/50 rounded-full p-1 h-auto"
            onClick={() => setIsVisible(false)}
          >
            <X size={16} />
          </Button>
        </>
      ) : (
        <>
          <WifiOff size={18} className="text-red-600" />
          <div className="flex flex-col">
            <span className="font-semibold">Sem conexão</span>
            {retryCount > 0 && (
              <span className="text-xs opacity-80">Tentativa {retryCount}</span>
            )}
          </div>
          <Button 
            variant="warning" 
            size="sm" 
            rounded="full"
            className="ml-2 text-xs px-3 py-1 h-auto"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} className="mr-1" />
            Reconectar
          </Button>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
