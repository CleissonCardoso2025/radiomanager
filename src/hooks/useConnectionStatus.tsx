
import { useState, useEffect } from 'react';
import { connectionStatus, checkConnection } from '@/integrations/supabase/client';

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    const handleConnectionChange = (event: CustomEvent) => {
      const { isOnline, error, retryCount } = event.detail;
      setIsOnline(isOnline);
      setConnectionError(!!error);
      setRetryCount(retryCount);
    };
    
    window.addEventListener('connectionStatusChanged', handleConnectionChange as EventListener);
    
    // Initial connection check
    checkConnection();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connectionStatusChanged', handleConnectionChange as EventListener);
    };
  }, []);
  
  // Effect for auto-reconnection
  useEffect(() => {
    if (connectionError) {
      const retryTimeout = setTimeout(() => {
        console.log(`Tentativa automática de reconexão #${retryCount + 1}`);
        window.location.reload();
      }, 10000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [connectionError, retryCount]);

  return { isOnline, connectionError, retryCount };
}
