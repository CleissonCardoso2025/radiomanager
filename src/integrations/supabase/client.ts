import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// Configurações de retry
const MAX_RETRIES = 2; 
const RETRY_DELAY = 500; 

export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = error.message || error.toString();
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('timeout')
  );
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  },
  global: {
    fetch: async (url, options) => {
      let retries = 0;
      while (true) {
        try {
          return await fetch(url, options);
        } catch (error: any) {
          if (!isConnectionError(error) || retries >= MAX_RETRIES) {
            throw error;
          }
          retries++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
  }
});

let userEmailMap: Record<string, string> = {};

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

loadUserEmailMap();

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

      updateUserEmailMap(data.user.id, email);
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

export const getUsersWithEmails = async () => {
  try {
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

    const userEmailMap = loadUserEmailMap();

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

export const connectionStatus = {
  isOnline: navigator.onLine,
  lastError: null as Error | null,
  retryCount: 0,
  updateStatus(isOnline: boolean, error: Error | null = null) {
    this.isOnline = isOnline;
    this.lastError = error;
    this.retryCount = error ? this.retryCount + 1 : 0;
    window.dispatchEvent(new CustomEvent('connectionStatusChanged', { 
      detail: { isOnline, error, retryCount: this.retryCount } 
    }));
  }
};

window.addEventListener('online', () => connectionStatus.updateStatus(true));
window.addEventListener('offline', () => connectionStatus.updateStatus(false));

export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('testemunhais')
      .select('count()', { count: 'exact', head: true });

    if (error) {
      if (isConnectionError(error)) {
        connectionStatus.updateStatus(false, error);
      }
      return false;
    }

    connectionStatus.updateStatus(true);
    return true;
  } catch (error) {
    if (isConnectionError(error)) {
      connectionStatus.updateStatus(false, error as Error);
    }
    return false;
  }
};

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
