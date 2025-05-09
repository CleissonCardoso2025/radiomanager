
import { useState } from 'react';
import { useAuth } from './useAuth'; // Updated import to use our fixed useAuth
import { useConnectionStatus } from './useConnectionStatus';

export const useLoginForm = () => {
  const { user, isLoading: authLoading, userRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const { isOnline, connectionError, retryCount } = useConnectionStatus();

  // For handling form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // This is just a placeholder - the actual authentication logic is in useAuthentication
    console.log('Form submitted with:', { email, password, isSignUp });
    
    // This will be replaced by the authentication hook's implementation
  };

  // Set debug info in dev environment
  useState(() => {
    if (process.env.NODE_ENV !== 'production') {
      setDebugInfo('Login form initialized');
    }
  });

  return {
    // Form state
    email, 
    setEmail,
    password, 
    setPassword,
    isSignUp, 
    setIsSignUp,
    isLoading: isLoading || authLoading,
    handleSubmit,
    
    // Connection state
    isOnline,
    connectionError,
    retryCount,
    
    // Debug info
    debugInfo
  };
};
