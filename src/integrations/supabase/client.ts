import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";

// Configurações de retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

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

// Cliente Supabase base
const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});

// Função para esperar um tempo específico
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cliente Supabase com retry automático
export const supabase = {
  ...baseClient,
  
  // Sobrescrever o método from para adicionar retry
  from: <T extends keyof Database['public']['Tables']>(table: T) => {
    const originalFrom = baseClient.from(table);
    
    // Sobrescrever o método select para adicionar retry
    const originalSelect = originalFrom.select;
    originalFrom.select = function(this: any, ...args: any[]) {
      const originalQuery = originalSelect.apply(this, args);
      const originalExec = originalQuery.then;
      
      // Sobrescrever o método then para adicionar retry
      originalQuery.then = async function(this: any, ...thenArgs: any[]) {
        let lastError = null;
        let retries = 0;
        
        while (retries <= MAX_RETRIES) {
          try {
            // Verificar se estamos online
            if (!navigator.onLine) {
              await new Promise<void>((resolve) => {
                const handleOnline = () => {
                  window.removeEventListener('online', handleOnline);
                  resolve();
                };
                window.addEventListener('online', handleOnline);
              });
            }
            
            const result = await originalExec.apply(this, thenArgs);
            return result;
          } catch (error) {
            lastError = error;
            
            // Se for um erro de conexão, tentar novamente
            if (isConnectionError(error) && retries < MAX_RETRIES) {
              console.log(`Tentativa ${retries + 1}/${MAX_RETRIES} falhou, tentando novamente em ${RETRY_DELAY}ms...`);
              retries++;
              await sleep(RETRY_DELAY * retries); // Atraso exponencial
              continue;
            }
            
            // Se não for um erro de conexão ou já tentamos o máximo, lançar o erro
            throw error;
          }
        }
        
        // Se chegamos aqui, todas as tentativas falharam
        throw lastError;
      };
      
      return originalQuery;
    };
    
    return originalFrom;
  },
  
  // Adicionar outros métodos do cliente Supabase que são públicos
  auth: baseClient.auth,
  storage: baseClient.storage,
  rpc: baseClient.rpc,
  functions: baseClient.functions,
  realtime: baseClient.realtime,
  channel: baseClient.channel,
  
  // Método para verificar a conexão com o Supabase
  async checkConnection() {
    try {
      // Fazemos uma chamada simples para verificar a conexão
      // Como não temos uma função RPC 'ping', vamos usar uma consulta simples
      const { data, error } = await baseClient.from('testemunhais').select('count()', { count: 'exact', head: true });
      
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

// Mapeamento de IDs de usuários para emails (armazenado no localStorage)
const USER_EMAIL_MAP_KEY = 'userEmailMap';

// Função para salvar o mapeamento de ID para email no localStorage
const saveUserEmailMap = (map: Record<string, string>) => {
  localStorage.setItem(USER_EMAIL_MAP_KEY, JSON.stringify(map));
};

// Função para carregar o mapeamento de ID para email do localStorage
const loadUserEmailMap = (): Record<string, string> => {
  const savedMap = localStorage.getItem(USER_EMAIL_MAP_KEY);
  return savedMap ? JSON.parse(savedMap) : {};
};

// Função para atualizar o mapeamento de ID para email
export const updateUserEmailMap = (userId: string, email: string) => {
  const map = loadUserEmailMap();
  map[userId] = email;
  saveUserEmailMap(map);
};

// Função para obter o email de um usuário pelo ID
export const getUserEmailById = (userId: string): string => {
  const map = loadUserEmailMap();
  return map[userId] || 'Usuário desconhecido';
};

// Instead of extending supabase.auth.admin which is a specific TypeScript type,
// let's create a helper function to handle user creation
export const createUserWithRole = async (
  email: string, 
  password: string, 
  role: 'admin' | 'locutor'
) => {
  try {
    // First, try to create the user using the standard signup method
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
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
      
      // Armazenar o email no mapeamento local
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
    
    // Obter o usuário atual para ter seu email
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // Carregar o mapeamento de IDs para emails do localStorage
    const userEmailMap = loadUserEmailMap();
    
    // Se o usuário atual não estiver no mapa, adicioná-lo
    if (currentUser && currentUser.email && !userEmailMap[currentUser.id]) {
      updateUserEmailMap(currentUser.id, currentUser.email);
    }
    
    // Mapear os usuários com seus emails
    const usersWithEmails = userRoles.map(userRole => {
      // Verificar se temos o email no mapeamento local
      let email = userEmailMap[userRole.user_id];
      
      // Se não temos o email no mapeamento e é o usuário atual, usar o email da sessão
      if (!email && currentUser && userRole.user_id === currentUser.id && currentUser.email) {
        email = currentUser.email;
        // Atualizar o mapeamento
        updateUserEmailMap(currentUser.id, currentUser.email);
      }
      
      // Se ainda não temos o email, criar um email baseado no ID e papel
      if (!email) {
        const shortId = userRole.user_id.substring(0, 6);
        email = `${userRole.role}.${shortId}@radiomanager.com`;
      }
      
      return {
        id: userRole.user_id,
        email: email,
        role: userRole.role,
        status: 'Ativo'
      };
    });
    
    return { data: usersWithEmails, error: null };
  } catch (error: any) {
    console.error('Erro na função getUsersWithEmails:', error);
    return { data: null, error };
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
