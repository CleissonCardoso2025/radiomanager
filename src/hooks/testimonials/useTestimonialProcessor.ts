
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';
import { useTestimonialUtils } from './useTestimonialUtils';
import { toast } from 'sonner';

export function useTestimonialProcessor() {
  const { getDayMap, differenceInMinutes } = useTestimonialUtils();
  
  const processTestimonials = useCallback(async (testimonials) => {
    try {
      console.log('Processing testimonials, count:', testimonials?.length);
      
      // Get current user - if not authenticated, still process testimonials
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (!user) {
        console.log('Warning: User not authenticated. Processing testimonials anyway.');
        // Continue processing instead of returning empty arrays
      }
      
      // Obter dia atual e formatar a data
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      const daysMap = getDayMap();
      const currentDayName = daysMap[dayOfWeek];
      console.log(`Current day: ${dayOfWeek} (${currentDayName})`);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      // Obter a hora atual
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      console.log(`Current time: ${currentTime} (${currentTotalMinutes} minutes)`);
      
      // Filtro local de testemunhais lidos hoje
      const localReadIds = JSON.parse(localStorage.getItem(`testemunhais_lidos_${formattedDate}`) || '[]');
      console.log('Locally read testimonial IDs:', localReadIds);
      
      if (!testimonials || testimonials.length === 0) {
        console.log('No testimonials to process');
        return { processedTestimonials: [], exactTimeItems: [] };
      }

      // Filtro principal - log each filtering decision
      const filteredData = testimonials.filter(t => {
        if (!t) {
          console.log('Invalid testimonial entry, skipping');
          return false;
        }

        // Adicionar campo tipo para todos os testemunhais
        t.tipo = 'testemunhal';
        
        // If program doesn't exist, still show the testimonial
        if (!t.programas || !t.programas.horario_inicio || !t.programas.horario_fim) {
          console.log(`Testimonial ${t.id} has no program assigned or incomplete program data`);
          // Relaxed: Include testimonials without program info
          return true;
        }
        
        // Verify if testimonial is scheduled for today
        const programDias = t.programas.dias || [];
        if (!programDias.includes(currentDayName)) {
          console.log(`Testimonial ${t.id} not scheduled for today (${currentDayName})`);
          return false;
        }
        
        // Skip testimonials read by the current user (if authenticated)
        if (user && t.lido_por && Array.isArray(t.lido_por) && t.lido_por.includes(user.id)) {
          console.log(`Testimonial ${t.id} already read by current user`);
          return false;
        }
        
        // Filtrar testemunhais lidos localmente
        if (localReadIds.includes(t.id)) {
          console.log(`Testimonial ${t.id} was marked as read locally`);
          return false;
        }
        
        console.log(`Testimonial ${t.id} passed all filters`);
        return true;
      });
      
      console.log(`Filtered testimonials: ${filteredData.length} passed out of ${testimonials.length}`);
      
      // Processar os testemunhais para adicionar informações de hora exata
      const processedTestimonials = filteredData.map(t => {
        // Verificar se é hora exata
        const testimonialTime = t.horario_agendado || '00:00';
        const isExactTime = testimonialTime === currentTime;
        
        // Calcular minutos até o horário agendado
        const [testHour, testMinute] = testimonialTime.split(':').map(Number);
        const testTotalMinutes = testHour * 60 + testMinute;
        const minutesUntil = testTotalMinutes - currentTotalMinutes;
        
        // Determine if it's upcoming (within 30 minutes or up to 15 minutes past)
        const isUpcoming = minutesUntil >= -15 && minutesUntil <= 30;
        
        console.log(`Testimonial ${t.id} (${testimonialTime}): isExactTime=${isExactTime}, isUpcoming=${isUpcoming}, minutesUntil=${minutesUntil}`);
        
        return {
          ...t,
          isExactTime,
          isUpcoming,
          minutesUntil
        };
      });
      
      // Sort by urgency: exact time first, then upcoming, then by time
      const sortedTestimonials = processedTestimonials.sort((a, b) => {
        // Exact time testimonials first
        if (a.isExactTime && !b.isExactTime) return -1;
        if (!a.isExactTime && b.isExactTime) return 1;
        
        // Then upcoming testimonials
        if (a.isUpcoming && !b.isUpcoming) return -1;
        if (!a.isUpcoming && b.isUpcoming) return 1;
        
        // Sort by minutes until if both are upcoming or both are not
        if (a.minutesUntil !== b.minutesUntil) return a.minutesUntil - b.minutesUntil;
        
        // Default sort by scheduled time
        return a.horario_agendado.localeCompare(b.horario_agendado);
      });
      
      // Calcular testemunhais no horário exato
      const exactTimeItems = sortedTestimonials.filter(t => 
        t.isExactTime && t.status !== 'lido'
      );
      
      console.log(`Testimonials sorted: ${sortedTestimonials.length} total, ${exactTimeItems.length} exact time`);
      
      // Play notification for exact time items on mobile
      if (exactTimeItems.length > 0 && isMobileDevice()) {
        playNotificationSound('notification');
        toast.info(`${exactTimeItems.length} testemunhais para o horário atual!`);
      }
      
      return { processedTestimonials: sortedTestimonials, exactTimeItems };
    } catch (error) {
      console.error('Error processing testimonials:', error);
      return { processedTestimonials: [], exactTimeItems: [] };
    }
  }, [getDayMap, differenceInMinutes]);
  
  return { processTestimonials };
}
