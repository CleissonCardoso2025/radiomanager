
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for managing user roles and permissions
 */
export const useRoleManagement = () => {
  /**
   * Fetches user role from user_roles table
   * @param userId User ID to fetch role for
   * @returns User role or null if error
   */
  const fetchUserRole = async (userId: string) => {
    try {
      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (roleError) {
        console.error('Error fetching user role:', roleError);
        return null;
      }
      
      return roleData?.role;
    } catch (error: any) {
      console.error('Error in fetchUserRole:', error);
      return null;
    }
  };

  /**
   * Creates default role for new user
   * @param userId User ID to assign role to
   * @returns Success status
   */
  const assignDefaultRole = async (userId: string): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'locutor'
        });
          
      if (insertError) {
        console.error('Error inserting role:', insertError);
        // Duplicate key error (23505) is not a real error in this case
        if (insertError.code !== '23505') {
          toast.error('Erro ao atribuir permissões ao usuário', {
            description: insertError.message,
          });
          return false;
        }
      }
      
      return true;
    } catch (error: any) {
      console.error('Error assigning default role:', error);
      return false;
    }
  };

  /**
   * Handles user navigation based on role
   * @param userRole Role of the user
   * @param navigate Navigation function
   */
  const handleRoleBasedNavigation = (userRole: string | null, navigate: (path: string) => void) => {
    if (userRole === 'admin') {
      toast.success('Login realizado com sucesso!', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      navigate('/');
    } else {
      // Locutor ou qualquer outro papel: redirecionar para agenda
      navigate('/agenda');
    }
  };

  return {
    fetchUserRole,
    assignDefaultRole,
    handleRoleBasedNavigation
  };
};
