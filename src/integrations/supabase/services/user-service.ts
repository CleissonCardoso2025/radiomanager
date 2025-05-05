
import { supabase } from '../core/client';

// Mapeamento de ID de usuário para e-mail
let userEmailMap: Record<string, string> = {};

// Carrega mapeamento do localStorage
export const loadUserEmailMap = (): Record<string, string> => {
  try {
    const storedMap = localStorage.getItem('userEmailMap');
    if (storedMap) {
      userEmailMap = JSON.parse(storedMap);
    }
  } catch (error) {
    console.error('Erro ao carregar mapeamento de emails:', error);
  }
  return userEmailMap;
};

// Inicializa mapeamento ao carregar
loadUserEmailMap();

// Atualiza mapeamento de e-mail
export const updateUserEmailMap = (userId: string, email: string): void => {
  const isTemporaryEmail = email.includes('@radiomanager.com') || email.includes('.anon.') || email.includes('.temp.');
  if (isTemporaryEmail && userEmailMap[userId] && !userEmailMap[userId].includes('@radiomanager.com')) {
    return;
  }
  userEmailMap[userId] = email;
  try {
    localStorage.setItem('userEmailMap', JSON.stringify(userEmailMap));
  } catch (error) {
    console.error('Erro ao salvar mapeamento de emails:', error);
  }
};

// Cria usuário com papel
export const createUserWithRole = async (email: string, password: string, role: 'admin' | 'locutor') => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { real_email: email }
      }
    });

    if (error) throw error;

    if (data.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role });

      if (roleError) throw roleError;

      // Adicionar email à tabela user_emails para armazenamento permanente
      const { error: emailError } = await supabase
        .from('user_emails')
        .insert({ user_id: data.user.id, email });

      if (emailError) {
        console.error('Erro ao salvar email do usuário:', emailError);
      }

      // Atualizar mapeamento local
      updateUserEmailMap(data.user.id, email);
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

// Buscar emails reais dos usuários do banco de dados
export const fetchUserEmails = async () => {
  try {
    // Primeiro, tentar buscar da tabela user_emails
    const { data: userEmails, error: userEmailsError } = await supabase
      .from('user_emails')
      .select('user_id, email');

    if (userEmailsError) {
      console.error('Erro ao buscar emails de usuários:', userEmailsError);
      return false;
    }

    // Se encontrou dados, atualizar o mapeamento local
    if (userEmails && userEmails.length > 0) {
      const map: Record<string, string> = {};
      userEmails.forEach(item => {
        map[item.user_id] = item.email;
      });
      
      // Mesclar com o mapeamento existente, priorizando emails do banco de dados
      const updatedMap = { ...userEmailMap, ...map };
      userEmailMap = updatedMap;
      localStorage.setItem('userEmailMap', JSON.stringify(updatedMap));
      return true;
    }

    // Tentar função RPC como alternativa
    const { data: rpcEmails, error: rpcError } = await supabase.rpc('get_user_emails');

    if (rpcError) {
      console.error('Erro ao buscar emails via RPC:', rpcError);
      return false;
    }

    if (rpcEmails && rpcEmails.length > 0) {
      const map: Record<string, string> = {};
      rpcEmails.forEach((item: { user_id: string, email: string }) => {
        map[item.user_id] = item.email;
      });
      
      const updatedMap = { ...userEmailMap, ...map };
      userEmailMap = updatedMap;
      localStorage.setItem('userEmailMap', JSON.stringify(updatedMap));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao sincronizar emails de usuários:', error);
    return false;
  }
};

// Retorna usuários com seus e-mails
export const getUsersWithEmails = async () => {
  try {
    // Tentar buscar emails atualizados do banco de dados
    await fetchUserEmails();

    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (userRolesError) {
      console.error('Erro ao buscar papéis de usuários:', userRolesError);
      throw userRolesError;
    }

    if (!userRoles || userRoles.length === 0) {
      return { data: [], error: null };
    }

    const usersWithEmails = userRoles.map(userRole => ({
      id: userRole.user_id,
      email: userEmailMap[userRole.user_id] || 'Email não disponível',
      role: userRole.role,
      status: 'Ativo'
    }));

    return { data: usersWithEmails, error: null };
  } catch (error) {
    console.error('Erro ao buscar usuários com emails:', error);
    return { data: [], error };
  }
};

// Atualiza a senha do usuário via função RPC
export const updateUserPassword = async (userId: string, newPassword: string) => {
  try {
    const { data, error } = await supabase
      .rpc('admin_update_user_password', {
        user_id: userId,
        new_password: newPassword
      });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};
