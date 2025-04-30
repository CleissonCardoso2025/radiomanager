
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useContentProcessor() {
  const processContentItems = async (data: any[], localReadContentIds: string[]) => {
    try {
      console.log(`Processing ${data?.length || 0} content items`);
      
      // Get current user - if not authenticated, still process content
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Warning: User not authenticated. Processing content anyway.');
        // Continue processing instead of returning empty array
      }
      
      // Current date and time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
      
      // Get current day of week
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Map day names to numbers
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
      console.log(`Current day: ${dayOfWeek} (${currentDayName}), time: ${currentTime}`);
      
      if (!data || data.length === 0) {
        console.log('No content items to process');
        return [];
      }
      
      // Filter out items already read locally today
      const filteredByReadStatus = data.filter(item => !localReadContentIds.includes(item.id));
      console.log(`After filtering out locally read items: ${filteredByReadStatus.length} remaining`);
      
      // Filter content based on validity period and program
      const filteredData = filteredByReadStatus.filter(item => {
        if (!item) {
          console.log('Invalid content item found');
          return false;
        }

        const logPrefix = `Content ${item.id} (${item.nome || 'unnamed'})`;

        // Filter by date range: start_date <= today <= end_date (or if end_date doesn't exist, just start_date <= today)
        const today = new Date();
        const startDate = item.data_inicio ? new Date(item.data_inicio) : 
                         item.data_programada ? new Date(item.data_programada) : null;
        const endDate = item.data_fim ? new Date(item.data_fim) : null;
        
        if (startDate && today < startDate) {
          console.log(`${logPrefix} not yet in display period (future start_date)`);
          return false;
        }
        
        if (endDate && today > endDate) {
          console.log(`${logPrefix} expired (past end_date)`);
          return false;
        }

        // If content has program assigned, check if it's scheduled for today
        if (item.programas) {
          const program = item.programas;
          
          // Check if program is scheduled for the current day
          if (program.dias && Array.isArray(program.dias)) {
            if (!program.dias.includes(currentDayName)) {
              console.log(`${logPrefix} not scheduled for today (${currentDayName})`);
              return false;
            }
          }
          
          // Relaxed: If no scheduled time, still include the content
          if (!item.horario_programado) {
            console.log(`${logPrefix} has no scheduled time, including anyway`);
            return true;
          }
        }

        // Skip content that's been read by the current user (if authenticated)
        if (user && item.lido_por && Array.isArray(item.lido_por) && item.lido_por.includes(user.id)) {
          console.log(`${logPrefix} already read by current user`);
          return false;
        }

        console.log(`${logPrefix} passed all filters`);
        return true;
      });
      
      console.log(`After content filtering: ${filteredData.length} items remain`);
      
      // Process each content item with additional display properties
      const processedData = filteredData.map(item => {
        try {
          if (!item) {
            console.warn('Invalid item found during processing');
            return null;
          }
          
          const logPrefix = `Content ${item.id} (${item.nome || 'unnamed'})`;
          
          // If no scheduled time, use the current time
          const scheduledTime = item.horario_programado || currentTime.substring(0, 5);
          
          if (!scheduledTime || typeof scheduledTime !== 'string') {
            console.warn(`${logPrefix} has invalid scheduled time: ${scheduledTime}`);
            return null;
          }
          
          const scheduledTimeParts = scheduledTime.split(':');
          if (scheduledTimeParts.length < 2) {
            console.warn(`${logPrefix} has invalid time format: ${scheduledTime}`);
            return null;
          }
          
          const scheduledHour = parseInt(scheduledTimeParts[0], 10);
          const scheduledMinute = parseInt(scheduledTimeParts[1], 10);
          
          if (isNaN(scheduledHour) || isNaN(scheduledMinute)) {
            console.warn(`${logPrefix} has non-numeric time: ${scheduledHour}:${scheduledMinute}`);
            return null;
          }
          
          const scheduledDate = new Date();
          scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
          
          const minutesUntil = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60));
          
          // Consider content "upcoming" if it's within 30 minutes in the future or up to 15 minutes in the past
          const isUpcoming = minutesUntil >= -15 && minutesUntil <= 30;
          
          // Flag exact time matches
          const isExactTime = currentHour === scheduledHour && currentMinute === scheduledMinute;
          
          if (isExactTime && isMobileDevice()) {
            playNotificationSound('alert');
          }
          
          // Format end date for display if it's recurring content
          let recorrenteInfo = '';
          if (item.recorrente && item.data_fim) {
            const dataFim = new Date(item.data_fim);
            const dataFormatada = dataFim.toLocaleDateString('pt-BR');
            recorrenteInfo = `Recorrente até ${dataFormatada}`;
          }
          
          console.log(`${logPrefix} processed: isUpcoming=${isUpcoming}, isExactTime=${isExactTime}, minutesUntil=${minutesUntil}`);
          
          return {
            ...item,
            id: item.id || `temp-${Date.now()}-${Math.random()}`,
            texto: item.conteudo || "Sem conteúdo disponível",
            patrocinador: item.nome || "Sem nome",
            horario_agendado: scheduledTime,
            status: item.status || 'pendente',
            isExactTime,
            isUpcoming,
            minutesUntil,
            tipo: 'conteudo',
            recorrente: item.recorrente || false,
            data_fim: item.data_fim || null,
            recorrenteInfo: recorrenteInfo
          };
        } catch (err) {
          console.error('Error processing content item:', err, item);
          return null;
        }
      }).filter(Boolean);
      
      // Sort processed items by urgency and time
      const sortedData = processedData.sort((a, b) => {
        if (!a || !b) return 0;
        
        // Exact time items first
        if (a.isExactTime && !b.isExactTime) return -1;
        if (!a.isExactTime && b.isExactTime) return 1;
        
        // Then upcoming items
        if (a.isUpcoming && !b.isUpcoming) return -1;
        if (!a.isUpcoming && b.isUpcoming) return 1;
        
        // Sort by minutes until if both are upcoming or both are not
        if (a.minutesUntil !== b.minutesUntil) return a.minutesUntil - b.minutesUntil;
        
        // Default sort by scheduled time
        if (a.horario_programado && b.horario_programado) {
          return a.horario_programado.localeCompare(b.horario_programado);
        }
        
        return 0;
      });
      
      console.log(`Final processed content items: ${sortedData.length}`);
      
      return sortedData;
    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Erro ao processar conteúdos', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return [];
    }
  };
  
  return { processContentItems };
}
