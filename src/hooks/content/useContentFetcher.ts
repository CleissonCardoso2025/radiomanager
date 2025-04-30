
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useContentFetcher() {
  const fetchConteudos = async (dataAtual: string) => {
    try {
      console.log('Fetching content for date:', dataAtual);
      
      // Continue even if user is not authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Warning: User not authenticated. Fetching content anyway.');
        // Continue fetching instead of returning empty
      }
      
      // Get read content IDs from local storage
      const todayStr = dataAtual;
      const localReadContentIds = JSON.parse(localStorage.getItem(`conteudos_lidos_${todayStr}`) || '[]');
      console.log('Content items already marked as read locally:', localReadContentIds);
      
      // Fetch content for today (data_programada = today)
      const { data: regularData, error: regularError } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
        .eq('data_programada', dataAtual)
        .order('horario_programado', { ascending: true });
        
      console.log('Regular content for today:', regularData?.length || 0);
      
      // Fetch recurring content (recorrente = true)
      const { data: recurringData, error: recurringError } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
        .eq('recorrente', true)
        .order('horario_programado', { ascending: true });
        
      console.log('Recurring content:', recurringData?.length || 0);
      
      // Fetch content with validity period (data_fim >= today)
      const { data: validityData, error: validityError } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
        .not('data_fim', 'is', null) // Only items with data_fim defined
        .gte('data_fim', dataAtual) // End date greater than or equal to today
        .order('horario_programado', { ascending: true });
        
      console.log('Content with validity period:', validityData?.length || 0);
      
      // Check for errors
      const error = regularError || recurringError || validityError;
      
      if (error) {
        console.error('Error fetching content:', error);
        toast.error('Erro ao buscar conteúdos', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        return { data: [], error, localReadContentIds };
      }
      
      // Combine results from all three queries
      const allData = [
        ...(regularData || []),
        ...(recurringData || []),
        ...(validityData || [])
      ];
      
      // Remove duplicates based on ID
      const uniqueIds = new Set();
      const combinedData = allData.filter(item => {
        if (!item || !item.id) return false;
        if (uniqueIds.has(item.id)) return false;
        uniqueIds.add(item.id);
        return true;
      });
      
      console.log('Total content after removing duplicates:', combinedData.length);
      
      if (combinedData.length === 0) {
        console.log('No content found in database or all filtered out');
      }
      
      // Mark recurring content explicitly
      const processedData = combinedData.map(item => {
        // Check if it's recurring content (recorrente = true or has valid data_fim)
        const isRecurring = item.recorrente === true || (
          item.data_fim && 
          new Date(item.data_fim) >= new Date(dataAtual)
        );
        
        if (isRecurring) {
          console.log(`Found recurring content: ${item.id} - ${item.nome || 'Unnamed'}`);
          return {
            ...item,
            recorrente: true
          };
        }
        
        return item;
      });
      
      return { data: processedData, error: null, localReadContentIds };
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Erro ao buscar conteúdos', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return { data: [], error, localReadContentIds: [] };
    }
  };
  
  return { fetchConteudos };
}
