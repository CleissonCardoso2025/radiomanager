import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Sun, Volume2, Users, Shield, Loader2, Plus, Upload, Image, Trash, Pencil, Key } from 'lucide-react';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, createUserWithRole, getUsersWithEmails, updateUserPassword, updateUserEmailMap } from '@/integrations/supabase/client';
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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface EditUserForm {
  id: string;
  email: string;
  role: 'admin' | 'locutor';
}

interface PasswordChangeForm {
  id: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

const Configuracoes = () => {
  const { userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  const editForm = useForm<EditUserForm>({
    defaultValues: {
      id: '',
      email: '',
      role: 'locutor'
    }
  });

  const passwordForm = useForm<PasswordChangeForm>({
    defaultValues: {
      id: '',
      email: '',
      newPassword: '',
      confirmPassword: ''
    },
    mode: 'onChange'
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
      const { data: usersWithEmails, error } = await getUsersWithEmails();

      if (error) throw error;

      if (usersWithEmails) {
        const formattedUsers = usersWithEmails.map(user => {
          return {
            id: user.id,
            email: user.email,
            role: user.role as 'admin' | 'locutor',
            status: 'Ativo'
          };
        });
        
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
        await updateUserEmailMap(authData.user.id, data.email);
        
        const newUserObj: User = {
          id: authData.user.id,
          email: data.email,
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
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setSelectedUser(userToEdit);
      editForm.reset({
        id: userToEdit.id,
        email: userToEdit.email,
        role: userToEdit.role
      });
      setIsEditUserDialogOpen(true);
    }
  };

  const handlePasswordChange = (userId: string) => {
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setSelectedUser(userToEdit);
      passwordForm.reset({
        id: userToEdit.id,
        email: userToEdit.email,
        newPassword: '',
        confirmPassword: ''
      });
      setIsPasswordDialogOpen(true);
    }
  };

  const handleUpdateUser = async (data: EditUserForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: data.role })
        .eq('user_id', data.id);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(user => 
        user.id === data.id ? { ...user, role: data.role } : user
      ));
      
      setIsEditUserDialogOpen(false);
      
      toast.success('Usuário atualizado com sucesso!', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(`Erro ao atualizar usuário: ${error.message}`, {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (data: PasswordChangeForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('As senhas não conferem', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: result, error } = await updateUserPassword(data.id, data.newPassword);
      
      if (error) throw error;
      
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
      
      toast.success('Senha atualizada com sucesso!', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      toast.error(`Erro ao atualizar senha: ${error.message}`, {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
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
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Papel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {users.map(user => (
                                    <TableRow key={user.id}>
                                      <TableCell>{user.email}</TableCell>
                                      <TableCell className="capitalize">{user.role}</TableCell>
                                      <TableCell>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          user.status === 'Ativo' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {user.status}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleEditUser(user.id)}
                                            className="gap-1"
                                            disabled={user.email === 'cleissoncardoso@gmail.com'}
                                          >
                                            <Pencil size={14} />
                                            Editar
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handlePasswordChange(user.id)}
                                            className="gap-1"
                                            disabled={user.email === 'cleissoncardoso@gmail.com'}
                                          >
                                            <Key size={14} />
                                            Nova Senha
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
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

      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          
          <FormProvider {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
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
                <Button variant="outline" type="button" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          
          <FormProvider {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite a nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme a nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" disabled={isLoading || 
                      !passwordForm.watch('newPassword') || 
                      passwordForm.watch('newPassword') !== passwordForm.watch('confirmPassword')}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Alterar Senha'
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A senha do usuário será alterada imediatamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={passwordForm.handleSubmit(handleUpdatePassword)}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;
