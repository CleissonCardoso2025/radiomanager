
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Function to get Supabase config from localStorage with fallbacks
const getSupabaseConfig = () => {
  // Try localStorage first (original Lovable format)
  try {
    const storedUrl = localStorage.getItem('supabase_url');
    const storedKey = localStorage.getItem('supabase_anon_key');
    
    const url = storedUrl || "https://elgvdvhlzjphfjufosmt.supabase.co";
    const key = storedKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";
    
    console.log('Supabase config loaded:', { url, keyLength: key ? key.length : 0 });
    
    return { url, key };
  } catch (error) {
    console.warn('Não foi possível acessar localStorage para chaves do Supabase', error);
    
    // Use fallbacks as last resort (for preview environments)
    return {
      url: "https://elgvdvhlzjphfjufosmt.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho"
    };
  }
};

// Get configuration
const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = getSupabaseConfig();

// Initialize the Supabase client with basic configuration
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: localStorage
    }
  }
);
