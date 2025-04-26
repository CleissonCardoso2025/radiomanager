
/**
 * Service for managing API calls to OpenAI through Supabase Edge Functions
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
  }
};

