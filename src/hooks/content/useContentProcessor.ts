
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';

// Helper function for calculating minutes difference
function differenceInMinutes(dateA: Date, dateB: Date): number {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}

export function useContentProcessor() {
  const processContentItems = async (data: any[], localReadContentIds: string[]) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado durante processamento');
        return [];
      }
      
      // Filter content based on read status and validity period
      const filteredData = data.filter(item => {
        if (!item) {
          console.log('Item inválido encontrado na lista de conteúdos');
          return false;
        }
        
        // Skip content that's been marked as read locally today
        if (localReadContentIds.includes(item.id)) {
          console.log(`Conteúdo ${item.id} foi marcado como lido localmente. Removendo da lista.`);
          return false;
        }
        
        // Verificar se data_fim está definida e se a data atual está dentro do intervalo
        if (item.data_fim) {
          const dataFim = new Date(item.data_fim);
          const dataAtualObj = new Date();
          
          // Se a data atual for posterior à data_fim, não mostrar o conteúdo
          if (dataAtualObj > dataFim) {
            console.log(`Conteúdo ${item.id} não será exibido (fora do período de validade)`);
            return false;
          }
        }
        
        // Verificar se o conteúdo já foi lido pelo usuário atual
        if (item.lido_por && Array.isArray(item.lido_por) && item.lido_por.includes(user.id) && !item.recorrente) {
          console.log(`Conteúdo ${item.id} já foi lido pelo usuário atual, não exibindo`);
          return false;
        }
        
        return true;
      });
      
      // Process each content item with additional display properties
      const processedData = filteredData.map(item => {
        try {
          if (!item || !item.horario_programado || typeof item.horario_programado !== 'string') {
            console.warn('Item inválido ou sem horário programado:', item);
            return null;
          }
          
          const scheduledTimeParts = item.horario_programado.split(':');
          if (scheduledTimeParts.length < 2) {
            console.warn('Formato de horário inválido:', item.horario_programado);
            return null;
          }
          
          const scheduledHour = parseInt(scheduledTimeParts[0], 10);
          const scheduledMinute = parseInt(scheduledTimeParts[1], 10);
          
          if (isNaN(scheduledHour) || isNaN(scheduledMinute)) {
            console.warn('Horário não numérico:', scheduledHour, scheduledMinute);
            return null;
          }
          
          const scheduledDate = new Date();
          scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
          
          const now = new Date();
          const minutesUntil = differenceInMinutes(scheduledDate, now);
          
          const isUpcoming = minutesUntil >= -15 && minutesUntil <= 30; // Inclui até 15 minutos atrasados
          
          if (isUpcoming && isMobileDevice()) {
            playNotificationSound('alert');
          }
          
          return {
            ...item,
            id: item.id || `temp-${Date.now()}-${Math.random()}`,
            texto: item.conteudo || "Sem conteúdo disponível",
            patrocinador: item.nome || "Sem nome",
            horario_agendado: item.horario_programado,
            status: item.status || 'pendente',
            isUpcoming,
            minutesUntil,
            tipo: 'conteudo',
            recorrente: item.recorrente || false,
            data_fim: item.data_fim || null
          };
        } catch (err) {
          console.error('Erro ao processar conteúdo:', err, item);
          return null;
        }
      }).filter(Boolean);
      
      // Sort processed items by urgency and time
      const sortedData = processedData.sort((a, b) => {
        if (!a || !b) return 0;
        
        if (a.isUpcoming && !b.isUpcoming) return -1;
        if (!a.isUpcoming && b.isUpcoming) return 1;
        
        if (a.horario_programado && b.horario_programado) {
          return a.horario_programado.localeCompare(b.horario_programado);
        }
        
        return 0;
      });
      
      return sortedData;
    } catch (error) {
      console.error('Erro ao processar conteúdos:', error);
      return [];
    }
  };
  
  return { processContentItems };
}
