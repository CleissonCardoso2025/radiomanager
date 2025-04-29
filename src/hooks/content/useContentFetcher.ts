
import { supabase } from '@/integrations/supabase/client';

export function useContentFetcher() {
  const fetchConteudos = async (dataAtual: string) => {
    try {
      console.log('Buscando conteúdos para a data:', dataAtual);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return { data: [], error: new Error('Usuário não autenticado'), localReadContentIds: [] };
      }
      
      // Get read content IDs from local storage
      const todayStr = dataAtual;
      const localReadContentIds = JSON.parse(localStorage.getItem(`conteudos_lidos_${todayStr}`) || '[]');
      
      // Buscar conteúdos para hoje (data_programada = hoje)
      const { data: regularData, error: regularError } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
        .eq('data_programada', dataAtual)
        .order('horario_programado', { ascending: true });
        
      // Buscar conteúdos recorrentes (recorrente = true)
      const { data: recurringData, error: recurringError } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
        .eq('recorrente', true)
        .order('horario_programado', { ascending: true });
        
      // Buscar conteúdos com período de validade (data_fim >= hoje)
      const { data: validityData, error: validityError } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
        .not('data_fim', 'is', null) // Apenas conteúdos com data_fim definida
        .gte('data_fim', dataAtual) // Data de fim maior ou igual a hoje
        .order('horario_programado', { ascending: true });
        
      // Verificar erros
      const error = regularError || recurringError || validityError;
      
      if (error) {
        console.error('Erro ao buscar conteúdos:', error);
        return { data: [], error, localReadContentIds };
      }
      
      // Combinar os resultados das três consultas
      const allData = [
        ...(regularData || []),
        ...(recurringData || []),
        ...(validityData || [])
      ];
      
      // Remover duplicatas com base no ID
      const uniqueIds = new Set();
      const combinedData = allData.filter(item => {
        if (!item || !item.id) return false;
        if (uniqueIds.has(item.id)) return false;
        uniqueIds.add(item.id);
        return true;
      });
      
      // Marcar explicitamente os conteúdos recorrentes
      const processedData = combinedData.map(item => {
        // Verificar se é um conteúdo recorrente (tem recorrente = true ou data_fim válida)
        const isRecurring = item.recorrente === true || (
          item.data_fim && 
          new Date(item.data_fim) >= new Date(dataAtual)
        );
        
        if (isRecurring) {
          console.log(`Conteúdo recorrente encontrado: ${item.id} - ${item.nome || 'Sem nome'}`);
          return {
            ...item,
            recorrente: true
          };
        }
        
        return item;
      });
      
      console.log(`Encontrados ${processedData.length} conteúdos para exibição`);
      processedData.forEach(item => {
        console.log(`- ${item.id}: ${item.nome || 'Sem nome'} (${item.recorrente ? 'Recorrente' : 'Regular'})`);
      });
      
      return { data: processedData, error: null, localReadContentIds };
    } catch (error) {
      console.error('Erro no fetch de conteúdos:', error);
      return { data: [], error, localReadContentIds: [] };
    }
  };
  
  return { fetchConteudos };
}
