
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseAuthReturn {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  debugInfo: string;
}

export const useAuth = (): UseAuthReturn => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();

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
      const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '(usando fallback)';
      const keyPart = import.meta.env.VITE_SUPABASE_ANON_KEY 
        ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 5)}...` 
        : localStorage.getItem('supabase_anon_key') 
          ? `${localStorage.getItem('supabase_anon_key')?.substring(0, 5)}...` 
          : '(usando fallback)';
      setDebugInfo(`URL: ${url}, Key: ${keyPart}`);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        try {
          // Fetch user role from user_roles table
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .maybeSingle();
            
          if (roleError) {
            console.error('Error fetching user role:', roleError);
            // If the user exists but doesn't have a role, assign a default role
            if (roleError.code === 'PGRST116') {
              // Check if a role for this user already exists before inserting
              const { data: existingRole, error: checkError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', data.user.id);
                
              if (checkError) {
                console.error('Error checking existing role:', checkError);
              }
              
              // Only insert if no role exists
              if (!existingRole || existingRole.length === 0) {
                const { error: insertError } = await supabase
                  .from('user_roles')
                  .insert({
                    user_id: data.user.id,
                    role: 'locutor'
                  });
                  
                if (insertError) {
                  console.error('Error inserting role:', insertError);
                  if (insertError.code === '23505') {
                    // This is a duplicate key error, but we can proceed since the role already exists
                    console.log('Role already exists for user, continuing...');
                  } else {
                    throw new Error('Erro ao atribuir permissões ao usuário: ' + insertError.message);
                  }
                }
              } else {
                console.log('User already has a role, no need to insert');
              }
              
              // Set default role after checking/insertion
              toast.success('Login realizado com sucesso! Atribuindo permissões de locutor.', {
                position: 'bottom-right',
                closeButton: true,
                duration: 5000
              });
              navigate('/agenda');
              return;
            } else {
              throw new Error('Erro ao verificar permissões do usuário: ' + roleError.message);
            }
          }
          
          const userRole = roleData?.role;
          
          if (userRole === 'admin') {
            toast.success('Login realizado com sucesso!', {
              position: 'bottom-right',
              closeButton: true,
              duration: 5000
            });
            navigate('/');
          } else if (userRole === 'locutor') {
            // Locutor: redirecionar diretamente para agenda sem avisos
            navigate('/agenda');
          } else {
            throw new Error('Tipo de usuário não reconhecido');
          }
        } catch (roleError: any) {
          console.error('Erro ao verificar papel do usuário:', roleError);
          toast.error('Erro de Permissão', {
            description: roleError.message || 'Erro ao verificar permissões do usuário',
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
        }
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
