
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Criar uma conta' : 'Entrar no RadioManager'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Preencha os dados abaixo para criar sua conta'
              : 'Entre com seu email e senha para acessar o sistema'
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading 
                ? 'Processando...' 
                : isSignUp 
                  ? 'Criar conta' 
                  : 'Entrar'
              }
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Cadastre-se'
              }
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
