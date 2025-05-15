
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

  // Verificar se as credenciais do Supabase existem e mostrar apenas se não existirem
  useEffect(() => {
    const supabaseUrl = localStorage.getItem('supabase_url');
    const supabaseKey = localStorage.getItem('supabase_anon_key');
    
    if (!supabaseUrl || !supabaseKey) {
      setDebugInfo('Configuração necessária: Configure credenciais do Supabase.');
    } else if (process.env.NODE_ENV !== 'production') {
      // Em desenvolvimento, mostrar a URL mas não a chave
      setDebugInfo(`Conectando a: ${supabaseUrl}`);
    } else {
      // Em produção, não mostrar nenhum debug info se as credenciais existirem
      setDebugInfo('');
    }
  }, []);

  // For handling form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se as credenciais do Supabase existem
    const supabaseUrl = localStorage.getItem('supabase_url');
    const supabaseKey = localStorage.getItem('supabase_anon_key');
    
    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuração necessária', {
        description: 'Configure as credenciais do Supabase antes de fazer login.',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Iniciando autenticação com Supabase');
      
      if (isSignUp) {
        // Handle signup
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) throw error;
        
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      } else {
        // Handle login
        console.log('Tentando login com:', email);
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
