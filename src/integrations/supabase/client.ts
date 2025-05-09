
// Re-export everything from core/client.ts
export * from './core/client';

// Export connection utilities
export { isConnectionError, connectionStatus, checkConnection } from './utils/connection-utils';

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
