
import { useContext } from 'react';
import { AuthContext } from '../App';

/**
 * Hook for accessing authentication context
 * @returns Authentication context with user, loading state, and role
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
