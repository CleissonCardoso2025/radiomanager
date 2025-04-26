
/**
 * Serviço para gerenciar chaves de API
 */
export const apiKeyService = {
  /**
   * Busca uma chave de API pelo nome usando o proxy do Supabase
   * @param name Nome da chave de API (ex: 'openai')
   * @returns A resposta da API ou throw error
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
