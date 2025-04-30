
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';
import { useTestimonialUtils } from './useTestimonialUtils';

export function useTestimonialProcessor() {
  const { getDayMap } = useTestimonialUtils();
  
  const processTestimonials = useCallback(async (testimonials) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (!user) {
        console.log('Usuário não autenticado. Retornando lista vazia.');
        return { processedTestimonials: [], exactTimeItems: [] };
      }
      
      // Obter dia atual e formatar a data
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      const daysMap = getDayMap();
      const currentDayName = daysMap[dayOfWeek];
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      // Obter a hora atual
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      
      // Filtro local de testemunhais lidos hoje
      const localReadIds = JSON.parse(localStorage.getItem(`testemunhais_lidos_${formattedDate}`) || '[]');
      
      // Filtro principal
      const filteredData = testimonials.filter(t => {
        // Adicionar campo tipo para todos os testemunhais
        t.tipo = 'testemunhal';
        
        // Verificar se o programa existe e tem horários definidos
        if (!t.programas || !t.programas.horario_inicio || !t.programas.horario_fim) {
          return false;
        }
        
        // Verificar se o programa está programado para hoje
        const programDias = t.programas.dias || [];
        if (!programDias.includes(currentDayName)) {
          return false;
        }
        
        // Verificar se o testemunhal já foi lido pelo usuário atual
        if (user && t.lido_por && Array.isArray(t.lido_por) && t.lido_por.includes(user.id)) {
          return false;
        }
        
        // Filtrar testemunhais lidos localmente
        if (localReadIds.includes(t.id)) {
          return false;
        }
        
        return true;
      });
      
      // Processar os testemunhais para adicionar informações de hora exata
      const processedTestimonials = filteredData.map(t => {
        // Verificar se é hora exata
        const testimonialTime = t.horario_agendado || '00:00';
        const isExactTime = testimonialTime === currentTime;
        
        // Calcular minutos até o horário agendado
        const [testHour, testMinute] = testimonialTime.split(':').map(Number);
        const testTotalMinutes = testHour * 60 + testMinute;
        const minutesUntil = testTotalMinutes - currentTotalMinutes;
        
        // Determinar se é próximo (dentro de 30 minutos)
        const isUpcoming = minutesUntil >= -15 && minutesUntil <= 30;
        
        return {
          ...t,
          isExactTime,
          isUpcoming,
          minutesUntil
        };
      });
      
      // Calcular testemunhais no horário exato
      const exactTimeItems = processedTestimonials.filter(t => 
        t.horario_agendado === currentTime && t.status !== 'lido'
      );
      
      return { processedTestimonials, exactTimeItems };
    } catch (error) {
      console.error('Erro ao processar testemunhais:', error);
      return { processedTestimonials: [], exactTimeItems: [] };
    }
  }, [getDayMap]);
  
  return { processTestimonials };
}
