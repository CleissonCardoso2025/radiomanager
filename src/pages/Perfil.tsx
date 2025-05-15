
import React from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Perfil = () => {
  const { user, userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={0} />
      
      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-3xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold">{user?.email}</h2>
                <p className="text-sm text-gray-500">
                  {userRole === 'admin' ? 'Administrador' : 'Locutor'}
                </p>
              </div>

              <div className="w-full max-w-md space-y-4 mt-6">
                <div className="space-y-2">
                  <h3 className="font-medium">Informações da Conta</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p>{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Último acesso</p>
                      <p>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Perfil;
