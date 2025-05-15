
import { useContext } from 'react';
import { AuthContext } from '../App';

/**
 * Hook para acessar o contexto de autenticação
 * @returns Contexto de autenticação com usuário, estado de carregamento e papel
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};
