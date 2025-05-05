
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { isConnectionError } from '../utils/connection-utils';

// Try to get from environment variables first, then localStorage, then fallbacks
const getSupabaseConfig = () => {
  // Try environment variables first (for production/VPS environments)
  let url = import.meta.env.VITE_SUPABASE_URL;
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // If not available from environment, try localStorage (for development)
  if (!url || !key) {
    try {
      const storedUrl = localStorage.getItem('supabase_url');
      const storedKey = localStorage.getItem('supabase_anon_key');
      
      url = storedUrl || url;
      key = storedKey || key;
    } catch (error) {
      console.warn('Não foi possível acessar localStorage para chaves do Supabase');
    }
  }
  
  // If key is empty string, set to undefined so fallback works
  if (key === '') key = undefined;
  if (url === '') url = undefined;
  
  // Use fallbacks as last resort (for preview environments)
  return {
    url: url || "https://elgvdvhlzjphfjufosmt.supabase.co",
    key: key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho"
  };
};

// Obter configuração
const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = getSupabaseConfig();

// Configure retry settings
const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

// Initialize the Supabase client
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
