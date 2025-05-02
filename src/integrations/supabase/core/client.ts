
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import { isConnectionError } from '../utils/connection-utils';

// Use hardcoded values for stability
const SUPABASE_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";

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
