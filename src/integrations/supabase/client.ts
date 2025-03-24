import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";

// Configurações de retry
const MAX_RETRIES = 2; 
const RETRY_DELAY = 500; 

// Função para verificar se o erro é de conexão
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

// Cliente Supabase com configuração otimizada
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

// Mapeamento de IDs de usuário para emails
let userEmailMap: Record<string, string> = {};

// Carregar o mapeamento do localStorage
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

// Inicializar o mapeamento
loadUserEmailMap();

// Atualizar o mapeamento
export const updateUserEmailMap = (userId: string, email: string): void => {
  // Verificar se o email parece ser um email temporário do Supabase
  const isTemporaryEmail = email.includes('@radiomanager.com') || email.includes('.anon.') || email.includes('.temp.');
  
  // Se for um email temporário e já tivermos um email real, não atualizar
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

// Função para criar um novo usuário com papel
export const createUserWithRole = async (email: string, password: string, role: 'admin' | 'locutor') => {
  try {
    // Criar o usuário
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          real_email: email // Armazenar o email real nos metadados do usuário
        }
      }
    });
    
    if (error) throw error;
    
    // If user was created successfully, add the role
    if (data.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: role
        });
      
      if (roleError) throw roleError;
      
      // Armazenar o email real no localStorage
      updateUserEmailMap(data.user.id, email);
    }
    
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

// Function to get users with their emails
export const getUsersWithEmails = async () => {
  try {
    // Obter todos os papéis de usuário
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
    
    // Carregar o mapeamento de IDs para emails do localStorage
    const userEmailMap = loadUserEmailMap();
    
    // Mapear os usuários com seus emails
    const usersWithEmails = userRoles.map(userRole => {
      return {
        id: userRole.user_id,
        email: userEmailMap[userRole.user_id] || 'Email não disponível',
        role: userRole.role,
        status: 'Ativo' 
      };
    });
    
    return { data: usersWithEmails, error: null };
  } catch (error) {
    console.error('Erro ao buscar usuários com emails:', error);
    return { data: [], error };
  }
};

// Status da conexão
export const connectionStatus = {
  isOnline: navigator.onLine,
  lastError: null as Error | null,
  retryCount: 0,
  
  // Atualizar o status da conexão
  updateStatus(isOnline: boolean, error: Error | null = null) {
    this.isOnline = isOnline;
    this.lastError = error;
    
    if (error) {
      this.retryCount++;
    } else {
      this.retryCount = 0;
    }
    
    // Disparar evento para notificar componentes
    window.dispatchEvent(new CustomEvent('connectionStatusChanged', { 
      detail: { isOnline, error, retryCount: this.retryCount } 
    }));
  }
};

// Inicializar listeners de eventos online/offline
window.addEventListener('online', () => connectionStatus.updateStatus(true));
window.addEventListener('offline', () => connectionStatus.updateStatus(false));

// Função para verificar a conexão com o Supabase
export const checkConnection = async () => {
  try {
    // Fazemos uma chamada simples para verificar a conexão
    // Como não temos uma função RPC 'ping', vamos usar uma consulta simples
    const { data, error } = await supabase.from('testemunhais').select('count()', { count: 'exact', head: true });
    
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

// Function to update a user's password
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
