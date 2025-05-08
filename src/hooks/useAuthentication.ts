
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateAndSanitizeHeaders } from '@/utils/authUtils';
import { useRoleManagement } from './useRoleManagement';

/**
 * Core authentication hook for handling login, signup, and session management
 */
export const useAuthentication = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();
  
  // Get role management functions
  const { fetchUserRole, assignDefaultRole, handleRoleBasedNavigation } = useRoleManagement();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    };
    
    checkSession();
    
    // Debug info - only for development
    if (process.env.NODE_ENV !== 'production') {
      const url = localStorage.getItem('supabase_url') || '(usando fallback)';
      const keyPart = localStorage.getItem('supabase_anon_key') 
        ? `${localStorage.getItem('supabase_anon_key')?.substring(0, 5)}...` 
        : '(usando fallback)';
      setDebugInfo(`URL: ${url}, Key: ${keyPart}`);
    }
  }, [navigate]);

  /**
   * Handle form submission for login or signup
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Handle signup
        await handleSignUp();
      } else {
        // Handle login
        await handleLogin();
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      toast.error(isSignUp ? 'Erro ao criar conta' : 'Erro ao fazer login', {
        description: error.message || 'Verifique suas credenciais e tente novamente.',
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle user signup process
   */
  const handleSignUp = async () => {
    // Prepare options for the signup request
    const apiKey = localStorage.getItem('supabase_anon_key') || undefined;
    
    // Log the API key being used (safely)
    console.log('Using API key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'undefined');
    
    // Sign up with current Supabase client which already has auth config
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Add any additional signup options here if needed
      }
    });
    
    if (error) throw error;
    
    toast.success('Conta criada com sucesso! Verifique seu email para confirmar.', {
      position: 'bottom-right',
      closeButton: true,
      duration: 5000
    });
  };

  /**
   * Handle user login process
   */
  const handleLogin = async () => {
    // Sign in with default options
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    try {
      // Fetch user role from user_roles table
      const userRole = await fetchUserRole(data.user.id);
      
      if (!userRole) {
        // If the user exists but doesn't have a role, assign a default role
        const success = await assignDefaultRole(data.user.id);
        
        if (success) {
          toast.success('Login realizado com sucesso! Atribuindo permissões de locutor.', {
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          navigate('/agenda');
          return;
        } else {
          throw new Error('Erro ao atribuir permissões ao usuário');
        }
      }
      
      // Handle navigation based on user role
      handleRoleBasedNavigation(userRole, navigate);
      
    } catch (roleError: any) {
      console.error('Erro ao verificar papel do usuário:', roleError);
      toast.error('Erro de Permissão', {
        description: roleError.message || 'Erro ao verificar permissões do usuário',
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSignUp,
    setIsSignUp,
    isLoading,
    handleSubmit,
    debugInfo
  };
};
