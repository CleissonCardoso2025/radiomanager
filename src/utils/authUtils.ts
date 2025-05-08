
/**
 * Authentication utility functions for header validation and sanitization
 */

/**
 * Validates and sanitizes headers for API requests
 * Ensures all headers are valid strings and adds default Content-Type if missing
 */
export const validateAndSanitizeHeaders = (headers: Record<string, any>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  // Log the original headers for debugging
  console.log('Original headers before sanitization:', headers);
  
  // Go through each header and ensure it's a valid string
  Object.entries(headers || {}).forEach(([key, value]) => {
    // Skip null/undefined keys
    if (key == null) return;
    
    // Convert key to string
    const sanitizedKey = String(key);
    
    // Handle null/undefined values by using empty string as fallback
    const sanitizedValue = value != null ? String(value) : '';
    
    sanitized[sanitizedKey] = sanitizedValue;
  });
  
  // Add default Content-Type if missing
  if (!sanitized['Content-Type']) {
    sanitized['Content-Type'] = 'application/json';
  }
  
  // Log the sanitized headers
  console.log('Sanitized headers:', sanitized);
  
  return sanitized;
};
