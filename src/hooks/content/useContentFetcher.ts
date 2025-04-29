
import { supabase } from '@/integrations/supabase/client';

export function useContentFetcher() {
  const fetchConteudos = async (dataAtual: string) => {
    try {
      // Check if table exists
      const { error: checkError } = await supabase
        .from('conteudos_produzidos')
        .select('count')
        .limit(1);
        
      if (checkError && checkError.code === '42P01') {
        console.error('Tabela conteudos_produzidos não existe:', checkError);
        return { data: [], error: checkError, localReadContentIds: [] };
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return { data: [], error: new Error('Usuário não autenticado'), localReadContentIds: [] };
      }
      
      // Get read content IDs from local storage
      const todayStr = dataAtual;
      const localReadContentIds = JSON.parse(localStorage.getItem(`conteudos_lidos_${todayStr}`) || '[]');
      
      // Fetch content data
      const { data, error } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
        .eq('data_programada', dataAtual)
        .order('horario_programado', { ascending: true });
      
      return { data, error, localReadContentIds };
    } catch (error) {
      console.error('Erro no fetch de conteúdos:', error);
      return { data: [], error, localReadContentIds: [] };
    }
  };
  
  return { fetchConteudos };
}
