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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
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
        
        // Verificar se o usuário é admin ou locutor
        const isAdmin = email === 'cleissoncardoso@gmail.com';
        
        if (isAdmin) {
          toast.success('Login realizado com sucesso!', {
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          navigate('/');
        } else {
          // Locutor: redirecionar diretamente para agenda sem avisos
          navigate('/agenda');
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

  // Função para facilitar o login com usuários de teste
  const handleTestLogin = async (userType: 'admin' | 'locutor') => {
    setIsLoading(true);
    
    try {
      // Credenciais de teste - em um ambiente de produção, isso não existiria
      const testCredentials = {
        admin: {
          email: 'cleissoncardoso@gmail.com',
          password: 'password123' // Senha simplificada para testes
        },
        locutor: {
          email: 'locutor@radiomanager.com',
          password: 'password123' // Senha simplificada para testes
        }
      };
      
      const { email, password } = testCredentials[userType];
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (userType === 'admin') {
        toast.success(`Login como administrador realizado com sucesso!`, {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        navigate('/');
      } else {
        // Locutor: redirecionar diretamente para agenda sem avisos
        navigate('/agenda');
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      toast.error(`Erro ao fazer login como ${userType}`, {
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
            
            {/* Botões para teste rápido de login */}
            {!isSignUp && (
              <div className="w-full pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 text-center">Acesso rápido para testes:</p>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTestLogin('admin')}
                    disabled={isLoading}
                  >
                    Admin
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTestLogin('locutor')}
                    disabled={isLoading}
                  >
                    Locutor
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
