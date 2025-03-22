import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Sun, Volume2, Users, Shield, Loader2, Plus, Upload, Image, Trash } from 'lucide-react';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, createUserWithRole } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  systemSounds: boolean;
  maintenanceMode: boolean;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'locutor';
  status: string;
}

interface NewUserForm {
  email: string;
  password: string;
  role: 'admin' | 'locutor';
}

const Configuracoes = () => {
  const { userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'locutor'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: false,
    pushNotifications: false,
    darkMode: false,
    systemSounds: false,
    maintenanceMode: false
  });

  const form = useForm<NewUserForm>({
    defaultValues: {
      email: '',
      password: '',
      role: 'locutor'
    }
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }

    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at
        `);

      if (error) throw error;

      if (data) {
        const formattedUsers = data.map(userRole => ({
          id: userRole.user_id,
          email: userRole.user_id,
          role: userRole.role as 'admin' | 'locutor',
          status: 'Ativo'
        }));
        
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Não foi possível carregar a lista de usuários', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleToggle = (setting: keyof UserSettings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [setting]: !prev[setting] };
      
      if (setting === 'darkMode') {
        if (newSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      return newSettings;
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'image/png') {
      toast.error('Por favor, selecione um arquivo PNG', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 2MB', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setCustomLogo(base64String);
      localStorage.setItem('customLogo', base64String);
      
      toast.success('Logo atualizado com sucesso!', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCustomLogo(null);
    localStorage.removeItem('customLogo');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast.success('Logo removido com sucesso!', {
      position: 'bottom-right',
      closeButton: true,
      duration: 5000
    });
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Configurações salvas com sucesso!', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    }, 1000);
  };

  const handleAddUser = async (data: NewUserForm) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await createUserWithRole(
        data.email, 
        data.password, 
        data.role
      );
      
      if (error) throw error;
      
      if (authData?.user) {
        const newUserObj: User = {
          id: authData.user.id,
          email: authData.user.email || data.email,
          role: data.role,
          status: 'Ativo'
        };
        
        setUsers(prev => [...prev, newUserObj]);
        setIsUserDialogOpen(false);
        form.reset();
        
        toast.success('Usuário adicionado com sucesso!', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      
      let errorMessage = 'Erro ao adicionar usuário';
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'Este email já está em uso';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage, {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (userId: string) => {
    toast.info('Funcionalidade de edição em desenvolvimento', {
      position: 'bottom-right',
      closeButton: true,
      duration: 5000
    });
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
                  <>
                    <TabsTrigger value="admin">Administração</TabsTrigger>
                    <TabsTrigger value="marca">Marca</TabsTrigger>
                  </>
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
                      <Switch 
                        checked={settings.emailNotifications} 
                        onCheckedChange={() => handleToggle('emailNotifications')} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações Push</Label>
                        <p className="text-sm text-gray-500">Receba notificações no navegador</p>
                      </div>
                      <Switch 
                        checked={settings.pushNotifications} 
                        onCheckedChange={() => handleToggle('pushNotifications')} 
                      />
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
                      <Switch 
                        checked={settings.darkMode} 
                        onCheckedChange={() => handleToggle('darkMode')} 
                      />
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
                      <Switch 
                        checked={settings.systemSounds} 
                        onCheckedChange={() => handleToggle('systemSounds')} 
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {userRole === 'admin' && (
                <>
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
                          <Switch 
                            checked={settings.maintenanceMode} 
                            onCheckedChange={() => handleToggle('maintenanceMode')} 
                          />
                        </div>
                        
                        <div className="space-y-0.5 mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="flex items-center gap-2">
                              <Users size={18} />
                              Usuários do Sistema
                            </Label>
                            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="gap-1">
                                  <Plus size={16} />
                                  Adicionar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                                  <DialogDescription>
                                    Preencha os dados para adicionar um novo usuário ao sistema.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <FormProvider {...form}>
                                  <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
                                    <FormField
                                      control={form.control}
                                      name="email"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Email</FormLabel>
                                          <FormControl>
                                            <Input type="email" placeholder="usuario@exemplo.com" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name="password"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Senha</FormLabel>
                                          <FormControl>
                                            <Input type="password" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name="role"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Papel</FormLabel>
                                          <Select onValueChange={field.onChange as (value: string) => void} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Selecione um papel" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="admin">Administrador</SelectItem>
                                              <SelectItem value="locutor">Locutor</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <DialogFooter>
                                      <Button variant="outline" type="button" onClick={() => setIsUserDialogOpen(false)}>
                                        Cancelar
                                      </Button>
                                      <Button type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                          </>
                                        ) : (
                                          'Adicionar'
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </FormProvider>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          <div className="border rounded-md overflow-hidden">
                            {isLoadingUsers ? (
                              <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : (
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
                                  {users.map(user => (
                                    <tr key={user.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{user.role}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          user.status === 'Ativo' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {user.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => handleEditUser(user.id)}
                                          disabled={user.email === 'cleissoncardoso@gmail.com'}
                                        >
                                          Editar
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="marca" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Image size={20} />
                        Personalização da Marca
                      </h3>
                      <div className="space-y-6 border rounded-md p-4">
                        <div className="space-y-4">
                          <Label>Logo da Aplicação</Label>
                          <p className="text-sm text-gray-500">
                            Faça upload de um arquivo PNG para substituir o nome "RadioManager" no cabeçalho.
                            O arquivo deve ter no máximo 2MB.
                          </p>
                          
                          <div className="flex flex-col space-y-4">
                            {customLogo && (
                              <div className="border rounded-md p-4 bg-gray-50">
                                <p className="text-sm font-medium mb-2">Logo atual:</p>
                                <div className="flex items-center justify-between">
                                  <img 
                                    src={customLogo} 
                                    alt="Logo personalizado" 
                                    className="h-12 max-w-[200px] object-contain"
                                  />
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={handleRemoveLogo}
                                    className="gap-1"
                                  >
                                    <Trash size={16} />
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4">
                              <input
                                type="file"
                                accept=".png"
                                className="hidden"
                                onChange={handleLogoUpload}
                                ref={fileInputRef}
                              />
                              <Button 
                                variant="outline" 
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-1"
                              >
                                <Upload size={16} />
                                Selecionar arquivo PNG
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </>
              )}
              
              <div className="pt-6">
                <Button 
                  className="w-full" 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
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
