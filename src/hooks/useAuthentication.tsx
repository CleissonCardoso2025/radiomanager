
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useConnectionStatus } from './useConnectionStatus';
import { useRoleManagement } from './useRoleManagement';

export const useAuthentication = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const { isOnline, connectionError, retryCount } = useConnectionStatus();
  const { fetchUserRole, handleRoleBasedNavigation } = useRoleManagement();

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Criar papel padrão para o usuário (locutor)
          const userId = data.user.id;
          try {
            await supabase
              .from('user_roles')
              .insert({ user_id: userId, role: 'locutor' });
          } catch (roleError) {
            console.error('Erro ao criar papel para o usuário:', roleError);
            // Não bloquear o fluxo por este erro
          }
        }
        
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      } else {
        // Handle login
        console.log('Tentando login com:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        if (data.user) {
          const userId = data.user.id;
          // Verificar papel do usuário
          const userRole = await fetchUserRole(userId);
          
          // Redirecionar baseado no papel
          handleRoleBasedNavigation(userRole, navigate);
        }
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
