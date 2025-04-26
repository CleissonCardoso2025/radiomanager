
/**
 * Service for managing API keys securely in localStorage
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
   * @param name Name of the API key (e.g., 'openai')
   * @param key The API key value
   */
  saveApiKey(name: string, key: string): void {
    try {
      const apiKeys = this.getAllApiKeys();
      apiKeys[name] = key;
      localStorage.setItem('api_keys', JSON.stringify(apiKeys));
    } catch (error) {
      console.error(`Error saving API key for ${name}:`, error);
      throw error;
    }
  },

  /**
   * Get an API key by its name
   * @param name Name of the API key
   * @returns The API key or undefined if not found
   */
  getApiKey(name: string): string | undefined {
    const apiKeys = this.getAllApiKeys();
    return apiKeys[name];
  },

  /**
   * Remove an API key by its name
   * @param name Name of the API key to remove
   */
  removeApiKey(name: string): void {
    try {
      const apiKeys = this.getAllApiKeys();
      delete apiKeys[name];
      localStorage.setItem('api_keys', JSON.stringify(apiKeys));
    } catch (error) {
      console.error(`Error removing API key for ${name}:`, error);
      throw error;
    }
  },

  /**
   * Get all stored API keys
   * @returns Object containing all API keys
   */
  getAllApiKeys(): Record<string, string> {
    try {
      const storedKeys = localStorage.getItem('api_keys');
      return storedKeys ? JSON.parse(storedKeys) : {};
    } catch (error) {
      console.error('Error retrieving API keys:', error);
      return {};
    }
  }
};
