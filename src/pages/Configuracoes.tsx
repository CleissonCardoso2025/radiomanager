import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Sun, Volume2, Users, Shield } from 'lucide-react';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Configuracoes = () => {
  const { userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simulando uma operação assíncrona
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Configurações salvas com sucesso!', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={0} />
      
      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-3xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="notificacoes">
              <TabsList className="mb-6">
                <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
                <TabsTrigger value="aparencia">Aparência</TabsTrigger>
                <TabsTrigger value="som">Som</TabsTrigger>
                {userRole === 'admin' && (
                  <TabsTrigger value="admin">Administração</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="notificacoes" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Bell size={20} />
                    Notificações
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações por Email</Label>
                        <p className="text-sm text-gray-500">Receba atualizações por email</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações Push</Label>
                        <p className="text-sm text-gray-500">Receba notificações no navegador</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="aparencia" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Sun size={20} />
                    Aparência
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Modo Escuro</Label>
                        <p className="text-sm text-gray-500">Alterne entre tema claro e escuro</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="som" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Volume2 size={20} />
                    Som
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sons do Sistema</Label>
                        <p className="text-sm text-gray-500">Ative ou desative sons de notificação</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {userRole === 'admin' && (
                <TabsContent value="admin" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Shield size={20} />
                      Gerenciamento de Acesso
                    </h3>
                    <div className="space-y-4 border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Modo de Manutenção</Label>
                          <p className="text-sm text-gray-500">Restringe o acesso apenas para administradores</p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="space-y-0.5 mt-6">
                        <Label className="flex items-center gap-2">
                          <Users size={18} />
                          Usuários do Sistema
                        </Label>
                        <p className="text-sm text-gray-500 mb-4">Lista de usuários com acesso ao sistema</p>
                        
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Papel</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">cleissoncardoso@gmail.com</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">Administrador</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Ativo
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Button variant="ghost" size="sm" disabled>Editar</Button>
                                </td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">locutor@radiomanager.com</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">Locutor</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Ativo
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Button variant="ghost" size="sm">Editar</Button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
              
              <div className="pt-6">
                <Button 
                  className="w-full" 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Configuracoes;
