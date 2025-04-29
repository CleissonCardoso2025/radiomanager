
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
      
      // Obter o programa atual
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
      
      // Obter o dia da semana atual
      // Filtrar conteúdos lidos hoje (inclusive recorrentes)
      data = data.filter(item => !localReadContentIds.includes(item.id));
      const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      
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
      
      // Filter content based on read status, validity period, and current program
      const filteredData = data.filter(item => {
        if (!item) {
          console.log('Item inválido encontrado na lista de conteúdos');
          return false;
        }

        // Filtro de datas: data_inicio <= hoje <= data_fim (ou se data_fim não existe, apenas data_inicio <= hoje)
        const hoje = new Date();
        const dataInicio = item.data_inicio ? new Date(item.data_inicio) : null;
        const dataFim = item.data_fim ? new Date(item.data_fim) : null;
        if (dataInicio && hoje < dataInicio) {
          console.log(`Conteúdo ${item.id} ainda não está no período de exibição (data_inicio futura)`);
          return false;
        }
        if (dataFim && hoje > dataFim) {
          console.log(`Conteúdo ${item.id} não será exibido (fora do período de validade)`);
          return false;
        }

        // Verificar se o conteúdo está dentro do horário do programa atribuído
        if (item.programas) {
          const programa = item.programas;
          // Verificar se o programa está programado para o dia atual
          if (programa.dias && Array.isArray(programa.dias)) {
            if (!programa.dias.includes(currentDayName)) {
              console.log(`Conteúdo ${item.id} não está programado para hoje (${currentDayName}). Removendo da lista.`);
              return false;
            }
          }
          if (programa.horario_inicio && programa.horario_fim) {
            // Verificar se o horário programado do conteúdo está dentro do horário do programa
            if (item.horario_programado) {
              if (item.horario_programado < programa.horario_inicio || item.horario_programado > programa.horario_fim) {
                console.log(`Conteúdo ${item.id} programado para ${item.horario_programado} fora do horário do programa ${programa.nome}. Removendo da lista.`);
                return false;
              }
            } else {
              // Se não tem horário programado, não exibe
              return false;
            }
          }
        }

        // Skip content that's been marked as read locally today (mesmo que seja recorrente)
        if (localReadContentIds.includes(item.id)) {
          console.log(`Conteúdo ${item.id} foi marcado como lido. Removendo da lista.`);
          return false;
        }

        // Verificar se o conteúdo já foi lido pelo usuário atual
        if (item.lido_por && Array.isArray(item.lido_por) && item.lido_por.includes(user.id)) {
          // Mesmo que seja recorrente, não exibir se já foi lido
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
          
          // Formatar a data de fim para exibição se for um conteúdo recorrente
          let recorrenteInfo = '';
          if (item.recorrente && item.data_fim) {
            const dataFim = new Date(item.data_fim);
            const dataFormatada = dataFim.toLocaleDateString('pt-BR');
            recorrenteInfo = `Recorrente até ${dataFormatada}`;
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
            data_fim: item.data_fim || null,
            recorrenteInfo: recorrenteInfo
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
