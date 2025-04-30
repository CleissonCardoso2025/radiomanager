
import { useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTestimonialFetcher() {
  const fetchTestimonials = useCallback(async () => {
    try {
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      
      // Map day names
      const daysMap: Record<number, string> = {
        0: 'domingo',
        1: 'segunda', 
        2: 'terca',
        3: 'quarta',
        4: 'quinta',
        5: 'sexta',
        6: 'sabado'
      };
      
      const currentDayName = daysMap[dayOfWeek];
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      console.log(`Fetching testimonials for date: ${formattedDate}, day: ${currentDayName}`);
      
      // Buscar testemunhais recorrentes
      let recurringData = [];
      const { data: recurringResponse, error: recurringError } = await supabase
        .from('testemunhais')
        .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_fim, recorrente, lido_por, programas(id, nome, dias, apresentador, horario_inicio, horario_fim), timestamp_leitura')
        .eq('recorrente', true)
        .order('horario_agendado', { ascending: true });
        
      if (recurringError) {
        console.error('Error fetching recurring testimonials:', recurringError);
      } else {
        recurringData = recurringResponse || [];
        console.log('Recurring testimonials:', recurringData.length);
      }
      
      // Buscar testemunhais regulares (não recorrentes)
      let regularData = [];
      const { data: regularResponse, error: regularError } = await supabase
        .from('testemunhais')
        .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_fim, recorrente, lido_por, programas(id, nome, dias, apresentador, horario_inicio, horario_fim), timestamp_leitura')
        .eq('recorrente', false)
        .is('data_fim', null)
        .order('horario_agendado', { ascending: true });
        
      if (regularError) {
        console.error('Error fetching regular testimonials:', regularError);
      } else {
        regularData = regularResponse || [];
        console.log('Regular testimonials:', regularData.length);
      }
      
      // Buscar testemunhais com período de validade
      let validityData = [];
      const { data: validityResponse, error: validityError } = await supabase
        .from('testemunhais')
        .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_fim, recorrente, lido_por, programas(id, nome, dias, apresentador, horario_inicio, horario_fim), timestamp_leitura')
        .not('data_fim', 'is', null)
        .gte('data_fim', formattedDate)
        .order('horario_agendado', { ascending: true });
          
      validityData = validityResponse || [];
      if (validityError) {
        console.error('Error fetching testimonials with validity period:', validityError);
      }
        
      // Combinar os resultados e remover duplicatas
      const allData = [
        ...(recurringData || []),
        ...(regularData || []),
        ...(validityData || [])
      ];
      
      // Remover duplicatas com base no ID
      const uniqueIds = new Set();
      const data = allData.filter(item => {
        if (!item || uniqueIds.has(item.id)) return false;
        uniqueIds.add(item.id);
        return true;
      });
      
      console.log('Total testimonials after removing duplicates:', data.length);
      
      if (data.length === 0) {
        console.log('No testimonials found in database or all filtered out');
      }
      
      return { allData: data, error: null };
    } catch (error) {
      console.error('Error in testimonial fetch:', error);
      toast.error('Erro ao carregar testemunhais', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return { allData: [], error };
    }
  }, []);
  
  return { fetchTestimonials };
}
