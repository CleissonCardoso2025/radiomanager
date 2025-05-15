
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// Hardcoded Supabase configuration values - visible in repository as requested
export const SUPABASE_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTU5NDIsImV4cCI6MjA2Mjg5MTk0Mn0.HLgxXN5sArx86sW33zGVVojMmuGERYRCzgydyxp_SpY";

// Function to get Supabase config - now combining localStorage and hardcoded values
const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_anon_key');
    
    // Use localStorage values if they exist
    if (url && key) {
      console.log('Using Supabase configuration from localStorage');
      return { url, key };
    }
  }
  
  // Fallback to hardcoded values
  console.log('Using hardcoded Supabase configuration');
  
  return { 
    url: SUPABASE_URL, 
    key: SUPABASE_ANON_KEY 
  };
};

// Get configuration
const config = getSupabaseConfig();

// Initialize the Supabase client with explicit configuration for authentication
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
