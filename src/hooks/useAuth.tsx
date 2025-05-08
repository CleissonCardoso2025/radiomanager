
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
      const url = localStorage.getItem('supabase_url') || '(usando fallback)';
      const keyPart = localStorage.getItem('supabase_anon_key') 
        ? `${localStorage.getItem('supabase_anon_key')?.substring(0, 5)}...` 
        : '(usando fallback)';
      setDebugInfo(`URL: ${url}, Key: ${keyPart}`);
    }
  }, [navigate]);

  const validateAndSanitizeHeaders = (headers: Record<string, any>): Record<string, string> => {
    const sanitized: Record<string, string> = {};
    
    // Log the original headers for debugging
    console.log('Original headers before sanitization:', headers);
    
    // Go through each header and ensure it's a valid string
    Object.entries(headers || {}).forEach(([key, value]) => {
      // Skip null/undefined keys
      if (key == null) return;
      
      // Convert key to string
      const sanitizedKey = String(key);
      
      // Handle null/undefined values by using empty string as fallback
      const sanitizedValue = value != null ? String(value) : '';
      
      sanitized[sanitizedKey] = sanitizedValue;
    });
    
    // Add default Content-Type if missing
    if (!sanitized['Content-Type']) {
      sanitized['Content-Type'] = 'application/json';
    }
    
    // Log the sanitized headers
    console.log('Sanitized headers:', sanitized);
    
    return sanitized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up with sanitized headers
        const options = {
          // Override the default headers with our sanitized version
          headers: validateAndSanitizeHeaders({
            'Content-Type': 'application/json',
            'apikey': localStorage.getItem('supabase_anon_key') || undefined,
          })
        };
        
        // Sign up with our custom options
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        }, options);
        
        if (error) throw error;
        
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      } else {
        // Sign in with default options
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
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: data.user.id,
                role: 'locutor'
              });
              
            if (insertError) {
              console.error('Error inserting role:', insertError);
              if (insertError.code !== '23505') { // Not a duplicate key error
                throw new Error('Erro ao atribuir permissões ao usuário: ' + insertError.message);
              }
            }
              
            toast.success('Login realizado com sucesso! Atribuindo permissões de locutor.', {
              position: 'bottom-right',
              closeButton: true,
              duration: 5000
            });
            navigate('/agenda');
            return;
          }
          
          const userRole = roleData?.role;
          
          if (userRole === 'admin') {
            toast.success('Login realizado com sucesso!', {
              position: 'bottom-right',
              closeButton: true,
              duration: 5000
            });
            navigate('/');
          } else {
            // Locutor ou qualquer outro papel: redirecionar para agenda
            navigate('/agenda');
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
