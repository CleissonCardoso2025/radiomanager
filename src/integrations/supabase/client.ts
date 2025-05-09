
// Re-export everything from core/client.ts
export * from './core/client';

// Export connection utilities
export { isConnectionError, connectionStatus, checkConnection } from './utils/connection-utils';

// Import supabase client directly from core client
import { supabase } from './core/client';

// Function to load user email map from localStorage
export const loadUserEmailMap = () => {
  try {
    const mapString = localStorage.getItem('user_email_map');
    if (mapString) {
      const userEmailMap = JSON.parse(mapString);
      console.log('Loaded user email map from localStorage:', 
        Object.keys(userEmailMap).length, 'entries');
      return userEmailMap;
    }
  } catch (error) {
    console.error('Error loading user email map:', error);
  }
  return {};
};

// Function to update user email map in localStorage
export const updateUserEmailMap = (userId: string, email: string) => {
  try {
    // Get existing map
    const existingMap = loadUserEmailMap() || {};
    
    // Only update if different
    if (existingMap[userId] !== email) {
      // Update map
      const updatedMap = {
        ...existingMap,
        [userId]: email
      };
      
      // Save to localStorage
      localStorage.setItem('user_email_map', JSON.stringify(updatedMap));
      console.log('Updated user email map in localStorage');
    }
  } catch (error) {
    console.error('Error updating user email map:', error);
  }
};

// Function to get email by user ID
export const getEmailByUserId = (userId: string): string | null => {
  try {
    const map = loadUserEmailMap();
    return map[userId] || null;
  } catch (error) {
    console.error('Error getting email by user ID:', error);
    return null;
  }
};

// Add the missing functions needed by Configuracoes.tsx
export const createUserWithRole = async (email: string, password: string, role: string) => {
  try {
    // Create the user with Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Assign the role to the new user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: role
        });

      if (roleError) throw roleError;

      // Store the email mapping
      updateUserEmailMap(data.user.id, email);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating user with role:', error);
    return { data: null, error };
  }
};

export const getUsersWithEmails = async () => {
  try {
    // Call the RPC function to get users with emails (this function should exist in your Supabase project)
    const { data, error } = await supabase
      .rpc('get_users_with_emails');

    if (error) throw error;

    // Add status field to each user
    const usersWithStatus = data.map((user: any) => ({
      ...user,
      status: 'Ativo' // Default status, you can modify this logic as needed
    }));

    return { data: usersWithStatus, error: null };
  } catch (error) {
    console.error('Error fetching users with emails:', error);
    return { data: null, error };
  }
};

export const updateUserPassword = async (userId: string, newPassword: string) => {
  try {
    // Call the RPC function to update user password by admin
    const { data, error } = await supabase
      .rpc('admin_update_user_password', {
        user_id: userId,
        new_password: newPassword
      });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user password:', error);
    return { data: null, error };
  }
};
