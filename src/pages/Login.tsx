
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionStatus from '@/components/ConnectionStatus';
import LoginForm from '@/components/auth/LoginForm';
import { useAuthentication } from '@/hooks/useAuthentication';

const Login = () => {
  const navigate = useNavigate();
  const { 
    email, setEmail,
    password, setPassword,
    isSignUp, setIsSignUp,
    isLoading,
    handleSubmit,
    debugInfo
  } = useAuthentication();

  // Get connection status independent of login form
  const { isOnline, connectionError, retryCount } = { isOnline: true, connectionError: null, retryCount: 0 };

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
      
      {/* Display connection status component only when there's an issue */}
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
