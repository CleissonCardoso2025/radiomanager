
import { useState } from 'react';
import { useAuth } from './useAuth';
import { useConnectionStatus } from './useConnectionStatus';

export const useLoginForm = () => {
  const { 
    email, setEmail,
    password, setPassword,
    isSignUp, setIsSignUp,
    isLoading,
    handleSubmit,
    debugInfo
  } = useAuth();
  
  const { isOnline, connectionError, retryCount } = useConnectionStatus();

  return {
    // Form state
    email, 
    setEmail,
    password, 
    setPassword,
    isSignUp, 
    setIsSignUp,
    isLoading,
    handleSubmit,
    
    // Connection state
    isOnline,
    connectionError,
    retryCount,
    
    // Debug info
    debugInfo
  };
};
