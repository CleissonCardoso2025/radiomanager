
import { useAuthentication } from './useAuthentication';

/**
 * Main authentication hook that powers the app's auth functionality
 * Interface remains the same to avoid breaking changes
 */
export interface UseAuthReturn {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  debugInfo: string;
}

/**
 * Hook that provides authentication functionality
 */
export const useAuth = (): UseAuthReturn => {
  // Use the main authentication hook with all functionality
  return useAuthentication();
};
