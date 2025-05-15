
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Função para obter configuração do Supabase do localStorage
const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_anon_key');
    
    // Verificar se as chaves existem no localStorage
    if (url && key) {
      console.log('Usando configuração do Supabase do localStorage');
      return { url, key };
    }
  }
  
  // Fallback para valores padrão (não recomendado para produção)
  console.log('Usando fallback de configuração do Supabase - configure através da tela de login');
  
  return { 
    url: 'https://elgvdvhlzjphfjufosmt.supabase.co', 
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho' 
  };
};

// Obter configuração e exportar valores para debug
const config = getSupabaseConfig();
export const SUPABASE_URL = config.url;
export const SUPABASE_ANON_KEY = config.key;

// Inicializar o cliente Supabase com configuração explícita para autenticação
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      detectSessionInUrl: true,
      flowType: 'implicit'
    }
  }
);

// Função para testar conexão
export const testConnection = async () => {
  try {
    const { error } = await supabase.from('user_roles').select('count').limit(1);
    return !error;
  } catch (e) {
    console.error('Erro ao testar conexão com o Supabase:', e);
    return false;
  }
};
