
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import ConnectionStatus from '@/components/ConnectionStatus';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  const { 
    email, setEmail,
    password, setPassword,
    isSignUp, setIsSignUp,
    isLoading,
    handleSubmit,
    debugInfo
  } = useAuth();
  
  const { isOnline, connectionError, retryCount } = useConnectionStatus();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <LoginForm 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        isOnline={isOnline}
        debugInfo={debugInfo}
      />
      
      {/* Display connection status component */}
      {(!isOnline || connectionError) && (
        <div className="mt-4">
          <ConnectionStatus 
            isOnline={isOnline} 
            connectionError={connectionError} 
            retryCount={retryCount}
          />
        </div>
      )}
    </div>
  );
};

export default Login;
