
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Hardcoded Supabase configuration values - visible in repository as requested
export const SUPABASE_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";

// Function to get Supabase config - now using hardcoded values directly
const getSupabaseConfig = () => {
  console.log('Using hardcoded Supabase configuration');
  
  return { 
    url: SUPABASE_URL, 
    key: SUPABASE_ANON_KEY 
  };
};

// Get configuration
const { url: SUPABASE_URL_CONFIG, key: SUPABASE_ANON_KEY_CONFIG } = getSupabaseConfig();

// Initialize the Supabase client with explicit configuration for authentication
export const supabase = createClient<Database>(
  SUPABASE_URL_CONFIG, 
  SUPABASE_ANON_KEY_CONFIG,
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
