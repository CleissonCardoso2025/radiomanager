
// Verifica se o erro é de conexão
export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = error.message || error.toString();
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('timeout')
  );
};

// Status da conexão
export const connectionStatus = {
  isOnline: navigator.onLine,
  lastError: null as Error | null,
  retryCount: 0,

  updateStatus(isOnline: boolean, error: Error | null = null) {
    this.isOnline = isOnline;
    this.lastError = error;
    this.retryCount = error ? this.retryCount + 1 : 0;

    window.dispatchEvent(new CustomEvent('connectionStatusChanged', {
      detail: { isOnline, error, retryCount: this.retryCount }
    }));
  }
};

// Verifica se o Supabase está acessível
export const checkConnection = async (supabaseClient: any): Promise<boolean> => {
  try {
    const { error } = await supabaseClient
      .from('testemunhais')
      .select('count()', { count: 'exact', head: true });

    if (error) {
      if (isConnectionError(error)) {
        connectionStatus.updateStatus(false, error);
      }
      console.log('Connection check failed:', error.message);
      return false;
    }

    connectionStatus.updateStatus(true);
    console.log('Connection check successful');
    return true;
  } catch (error) {
    console.log('Connection check error:', error);
    if (isConnectionError(error)) {
      connectionStatus.updateStatus(false, error as Error);
    }
    return false;
  }
};

// Configure event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser online event detected');
    connectionStatus.updateStatus(true);
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser offline event detected');
    connectionStatus.updateStatus(false);
  });
}
