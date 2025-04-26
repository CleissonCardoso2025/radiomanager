/**
 * Serviço para gerenciar chaves de API armazenadas no localStorage
 * 
 * Nota: Esta é uma solução temporária. Em uma implementação de produção,
 * estas chaves deveriam ser armazenadas de forma segura no backend ou
 * em um serviço de gerenciamento de segredos.
 */
export const apiKeyService = {
  /**
   * Prefixo usado para armazenar as chaves no localStorage
   */
  KEY_PREFIX: 'api_key_',

  /**
   * Busca uma chave de API pelo nome
   * @param name Nome da chave de API (ex: 'openai')
   * @returns A chave de API ou null se não encontrada
   */
  async getApiKey(name: string): Promise<string | null> {
    try {
      // Busca do localStorage
      const key = localStorage.getItem(`${this.KEY_PREFIX}${name}`);
      return key;
    } catch (error) {
      console.error(`Erro ao buscar chave de API ${name}:`, error);
      return null;
    }
  },

  /**
   * Salva uma chave de API no localStorage
   * @param name Nome da chave de API (ex: 'openai')
   * @param key Valor da chave de API
   * @returns true se a operação foi bem-sucedida, false caso contrário
   */
  async saveApiKey(name: string, key: string): Promise<boolean> {
    try {
      localStorage.setItem(`${this.KEY_PREFIX}${name}`, key);
      return true;
    } catch (error) {
      console.error(`Erro ao salvar chave de API ${name}:`, error);
      return false;
    }
  },

  /**
   * Remove uma chave de API do localStorage
   * @param name Nome da chave de API (ex: 'openai')
   */
  removeApiKey(name: string): void {
    localStorage.removeItem(`${this.KEY_PREFIX}${name}`);
  },

  /**
   * Lista todas as chaves de API armazenadas
   * @returns Um objeto com os nomes das chaves e seus valores
   */
  getAllApiKeys(): Record<string, string> {
    const keys: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.KEY_PREFIX)) {
        const name = key.replace(this.KEY_PREFIX, '');
        const value = localStorage.getItem(key);
        if (value) {
          keys[name] = value;
        }
      }
    }
    return keys;
  }
};
