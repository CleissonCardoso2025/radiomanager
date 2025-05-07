
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { isConnectionError } from '../utils/connection-utils';

// Function to get Supabase config from localStorage with fallbacks
const getSupabaseConfig = () => {
  // Try localStorage first (original Lovable format)
  try {
    const storedUrl = localStorage.getItem('supabase_url');
    const storedKey = localStorage.getItem('supabase_anon_key');
    
    const url = storedUrl || "https://elgvdvhlzjphfjufosmt.supabase.co";
    const key = storedKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";
    
    return { url, key };
  } catch (error) {
    console.warn('Não foi possível acessar localStorage para chaves do Supabase');
    
    // Use fallbacks as last resort (for preview environments)
    return {
      url: "https://elgvdvhlzjphfjufosmt.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho"
    };
  }
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
