
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionStatus from '@/components/ConnectionStatus';
import LoginForm from '@/components/auth/LoginForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useAuth();
  
  // Hook personalizado para o formulário de login
  const { 
    email, setEmail,
    password, setPassword,
    isSignUp, setIsSignUp,
    isLoading: authLoading,
    handleSubmit,
    debugInfo,
    isOnline, 
    connectionError, 
    retryCount
  } = {
    email: '',
    setEmail: (email: string) => {},
    password: '',
    setPassword: (password: string) => {},
    isSignUp: false,
    setIsSignUp: (isSignUp: boolean) => {},
    isLoading: false,
    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Verificar se as credenciais do Supabase existem
      const supabaseUrl = localStorage.getItem('supabase_url');
      const supabaseKey = localStorage.getItem('supabase_anon_key');
      
      if (!supabaseUrl || !supabaseKey) {
        alert('Configuração necessária: Configure as credenciais do Supabase antes de fazer login.');
        return;
      }
      
      try {
        console.log('Iniciando autenticação com Supabase');
        
        if (isSignUp) {
          // Handle signup
          const { error } = await supabase.auth.signUp({
            email,
            password
          });
          
          if (error) throw error;
          
          alert('Conta criada com sucesso! Verifique seu email para confirmar.');
        } else {
          // Handle login
          console.log('Tentando login com:', email);
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) throw error;
          
          alert('Login realizado com sucesso!');
        }
      } catch (error: any) {
        console.error('Erro de autenticação:', error);
        alert(`Erro: ${error.message || 'Verifique suas credenciais e tente novamente.'}`);
      }
    },
    debugInfo: '',
    isOnline: true,
    connectionError: null,
    retryCount: 0
  };
  
  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user && !isLoading) {
      console.log("Login: usuário autenticado, redirecionando. Role:", userRole);
      
      if (userRole === 'admin') {
        navigate('/', { replace: true });
      } else {
        navigate('/agenda', { replace: true });
      }
    }
  }, [user, isLoading, userRole, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <LoginForm 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        isLoading={isLoading || authLoading}
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
