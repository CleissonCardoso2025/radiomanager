
// This file now serves as a barrel file to re-export all Supabase functionality

// Re-export the core client
export { supabase } from './core/client';

// Re-export connection utilities
export { 
  isConnectionError, 
  connectionStatus,
  checkConnection 
} from './utils/connection-utils';

// Re-export user services
export {
  loadUserEmailMap,
  updateUserEmailMap,
  createUserWithRole,
  getUsersWithEmails,
  updateUserPassword
} from './services/user-service';
