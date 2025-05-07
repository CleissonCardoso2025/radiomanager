
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import LoginDebugInfo from './LoginDebugInfo';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isOnline: boolean;
  debugInfo: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  isLoading,
  handleSubmit,
  isOnline,
  debugInfo
}) => {
  return (
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
          
          {/* Debug info component */}
          <LoginDebugInfo debugInfo={debugInfo} isOnline={isOnline} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isOnline}
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
  );
};

export default LoginForm;
