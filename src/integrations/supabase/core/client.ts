
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Fallback URLs - serão substituídas por configurações do localStorage quando definidas
// Importante: Estas são apenas URLs de fallback e não incluem a chave real
const FALLBACK_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
const FALLBACK_KEY = ""; // Chave removida do repositório para segurança

// Função para obter configuração do Supabase - prioriza localStorage sobre valores padrão
const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_anon_key');
    
    // Use valores do localStorage se existirem
    if (url && key) {
      console.log('Usando configuração do Supabase do localStorage');
      return { url, key };
    }
  }
  
  // Verificar se há chave no localStorage
  const key = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;
  
  if (!key) {
    console.warn('ATENÇÃO: Nenhuma chave anônima do Supabase encontrada. Configure-a na tela de login.');
  }
  
  // Fallback para valores padrão
  return { 
    url: FALLBACK_URL, 
    key: key || FALLBACK_KEY 
  };
};

// Obter configuração
const config = getSupabaseConfig();

// Inicializar o cliente Supabase com configuração explícita para autenticação
export const supabase = createClient<Database>(
  config.url, 
  config.key,
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

// Exportar URL para referência, mas não a chave
export const SUPABASE_URL = config.url;
