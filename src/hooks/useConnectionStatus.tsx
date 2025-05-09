
import { useState, useEffect } from 'react';
import { connectionStatus, checkConnection, supabase } from '@/integrations/supabase/client';

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    const handleConnectionChange = (event: CustomEvent) => {
      const { isOnline, error, retryCount } = event.detail;
      setIsOnline(isOnline);
      setConnectionError(!!error);
      setRetryCount(retryCount);
    };
    
    window.addEventListener('connectionStatusChanged', handleConnectionChange as EventListener);
    
    // Initial connection check - run in a setTimeout to avoid blocking render
    setTimeout(() => {
      console.log('Running initial connection check...');
      checkConnection(supabase)
        .then(isConnected => {
          console.log('Initial connection check result:', isConnected ? 'connected' : 'disconnected');
        })
        .catch(err => {
          console.error('Error during initial connection check:', err);
        });
    }, 100);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connectionStatusChanged', handleConnectionChange as EventListener);
    };
  }, []);
  
  // Effect for auto-reconnection
  useEffect(() => {
    if (connectionError) {
      console.log(`Connection error detected, will attempt reconnect in 10s (retry #${retryCount + 1})`);
      const retryTimeout = setTimeout(() => {
        console.log(`Auto reconnect attempt #${retryCount + 1}`);
        checkConnection(supabase);
      }, 10000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [connectionError, retryCount]);

  return { isOnline, connectionError, retryCount };
}
