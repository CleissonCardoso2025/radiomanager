
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// URL e chave padrão - utilizadas apenas como fallback se não houver configuração no localStorage
const FALLBACK_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
const FALLBACK_KEY = ""; // Chave removida por segurança

// Função para obter configuração do Supabase - prioriza localStorage
const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_anon_key');
    
    // Usar valores do localStorage se existirem e parecerem válidos
    if (url && key && url.startsWith('https://') && key.startsWith('ey')) {
      console.log('Usando configuração do Supabase do localStorage');
      return { url, key };
    }
  }
  
  // Verificar se há chave no localStorage
  const key = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;
  
  if (!key || !key.startsWith('ey')) {
    console.warn('ATENÇÃO: Nenhuma chave anônima válida do Supabase encontrada. Configure-a na tela de login.');
  }
  
  // Fallback para valores padrão
  return { 
    url: FALLBACK_URL, 
    key: key && key.startsWith('ey') ? key : FALLBACK_KEY 
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
