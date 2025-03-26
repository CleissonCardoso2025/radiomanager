
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ConnectionErrorScreenProps {
  retryCount: number;
  onRetry: () => void;
}

const ConnectionErrorScreen: React.FC<ConnectionErrorScreenProps> = ({ retryCount, onRetry }) => {
  return (
    <div className="min-h-screen bg-background flex justify-center items-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Erro de conexão</AlertTitle>
        <AlertDescription className="mt-2">
          Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
        </AlertDescription>
        <div className="mt-4">
          <Button 
            variant="info"
            size="lg"
            rounded="lg"
            className="w-full shadow-lg"
            onClick={onRetry}
          >
            <RefreshCw size={18} className="mr-2 animate-spin-slow" />
            Tentar novamente
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default ConnectionErrorScreen;
