
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});

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
    }
    
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};
