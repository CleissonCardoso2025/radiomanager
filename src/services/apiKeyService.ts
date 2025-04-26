
/**
 * Service for managing API calls to OpenAI through Supabase Edge Functions
 * and local API key storage
 */
export const apiKeyService = {
  /**
   * Call OpenAI API through a proxy endpoint
   * @param messages Array of messages for the OpenAI API
   * @returns Response from OpenAI API
   */
  async callOpenAI(messages: any[]): Promise<any> {
    try {
      const response = await fetch('https://elgvdvhlzjphfjufosmt.supabase.co/functions/v1/openai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-token')}`
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        throw new Error('Failed to call OpenAI API');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  },

  /**
   * Save an API key to localStorage
   * @param name Name of the API key
   * @param key The API key value
   */
  saveApiKey(name: string, key: string): void {
    try {
      const apiKeys = this.getAllApiKeys();
      apiKeys[name] = key;
      localStorage.setItem('api_keys', JSON.stringify(apiKeys));
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  },

  /**
   * Get an API key from localStorage
   * @param name Name of the API key
   * @returns The API key value or null if not found
   */
  getApiKey(name: string): string | null {
    try {
      const apiKeys = this.getAllApiKeys();
      return apiKeys[name] || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  },

  /**
   * Remove an API key from localStorage
   * @param name Name of the API key to remove
   */
  removeApiKey(name: string): void {
    try {
      const apiKeys = this.getAllApiKeys();
      delete apiKeys[name];
      localStorage.setItem('api_keys', JSON.stringify(apiKeys));
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  },

  /**
   * Get all API keys from localStorage
   * @returns Object containing all API keys
   */
  getAllApiKeys(): Record<string, string> {
    try {
      const apiKeysStr = localStorage.getItem('api_keys');
      return apiKeysStr ? JSON.parse(apiKeysStr) : {};
    } catch (error) {
      console.error('Error getting all API keys:', error);
      return {};
    }
  }
};
