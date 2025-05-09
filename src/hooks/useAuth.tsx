
import { useContext } from 'react';
import { AuthContext } from '../App'; // Import directly from App where AuthContext is defined

/**
 * Main authentication hook that powers the app's auth functionality
 * Interface remains the same to avoid breaking changes
 */
export interface UseAuthReturn {
  user: any;
  isLoading: boolean;
  userRole: string | null;
}

/**
 * Hook that provides authentication functionality
 */
export const useAuth = (): UseAuthReturn => {
  // Use the AuthContext from App.tsx
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return authContext;
};
