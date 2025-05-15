
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useConnectionStatus } from './useConnectionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLoginForm = () => {
  const { user, isLoading: authLoading, userRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const { isOnline, connectionError, retryCount } = useConnectionStatus();

  // Atualizar informações de debug
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      try {
        const supabaseUrl = localStorage.getItem('supabase_url') || '(não configurado)';
        const keyPart = localStorage.getItem('supabase_anon_key') 
          ? `${localStorage.getItem('supabase_anon_key')?.substring(0, 5)}...` 
          : '(não configurado)';
        setDebugInfo(`URL: ${supabaseUrl}, Key: ${keyPart}`);
      } catch (error) {
        console.error('Erro ao obter dados de debug:', error);
        setDebugInfo('Erro ao obter configuração');
      }
    }
  }, []);

  // Para tratar o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Tratar cadastro
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) throw error;
        
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      } else {
        // Tratar login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      toast.error(isSignUp ? 'Erro ao criar conta' : 'Erro ao fazer login', {
        description: error.message || 'Verifique suas credenciais e tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Estado do formulário
    email, 
    setEmail,
    password, 
    setPassword,
    isSignUp, 
    setIsSignUp,
    isLoading: isLoading || authLoading,
    handleSubmit,
    
    // Estado da conexão
    isOnline,
    connectionError,
    retryCount,
    
    // Informações de debug
    debugInfo
  };
};
