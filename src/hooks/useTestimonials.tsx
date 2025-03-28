import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, notifyUpcomingTestimonial, playNotificationSound } from '@/services/notificationService';

export function useTestimonials(selectedProgram) {
  const [testemunhais, setTestemunhais] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exactTimeTestimonials, setExactTimeTestimonials] = useState<any[]>([]);
  const today = new Date();

  useEffect(() => {
    const fetchTestemunhais = async () => {
      try {
        setIsLoading(true);
        
        const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
        console.log('Current day of week:', dayOfWeek);
        
        const currentDate = format(today, 'yyyy-MM-dd');
        console.log('Current date:', currentDate);
        
        const { data, error } = await supabase
          .from('testemunhais')
          .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_inicio, data_fim, recorrente, lido_por, programas!inner(id, nome, dias, apresentador), timestamp_leitura')
          .order('horario_agendado', { ascending: true });
        
        if (error) {
          console.error('Error fetching testemunhais:', error);
          
          toast.error('Erro ao carregar testemunhais', {
            description: error.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          setTestemunhais([]);
        } else {
          console.log('Raw testemunhais data:', data);
          
          const filteredData = data && Array.isArray(data) ? data.filter(async t => {
            if (!t || !t.programas) return false;
            
            // Se o programa não for o selecionado e tivermos um programa selecionado, não mostrar
            if (selectedProgram && t.programa_id !== selectedProgram.id) {
              return false;
            }
            
            // Verificar se hoje é um dia em que o programa é transmitido
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
            const diasPrograma = t.programas.dias || [];
            
            // Mapear nomes dos dias para números
            const daysMap = {
              'domingo': 0,
              'segunda': 1,
              'terca': 2,
              'quarta': 3,
              'quinta': 4,
              'sexta': 5,
              'sabado': 6
            };
            
            // Converter os dias do programa para números e verificar se hoje é um desses dias
            const diasProgramaNumeros = diasPrograma.map(dia => daysMap[dia.toLowerCase()] || -1);
            if (!diasProgramaNumeros.includes(dayOfWeek)) {
              // Se hoje não for um dia em que o programa é transmitido, não mostrar
              return false;
            }
            
            // Verificar se o testemunhal está dentro do período de exibição
            let isWithinDateRange = true;
            
            if (t.data_inicio || t.data_fim) {
              // Se data_inicio existe, verificar se a data atual é maior ou igual
              if (t.data_inicio) {
                const startDateStr = t.data_inicio.toString();
                isWithinDateRange = isWithinDateRange && (currentDate >= startDateStr);
                console.log(`Start date check for ${t.id}:`, { currentDate, startDate: startDateStr, result: (currentDate >= startDateStr) });
              }
              
              // Se data_fim existe, verificar se a data atual é menor ou igual
              if (t.data_fim) {
                const endDateStr = t.data_fim.toString();
                isWithinDateRange = isWithinDateRange && (currentDate <= endDateStr);
                console.log(`End date check for ${t.id}:`, { currentDate, endDate: endDateStr, result: (currentDate <= endDateStr) });
              }
            }
            
            // Se não estiver dentro do período de datas, não mostrar
            if (!isWithinDateRange) return false;
            
            // Obter o usuário atual
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
              console.error('Usuário não autenticado');
              return false;
            }
            
            // Verificar se o testemunhal já foi lido pelo usuário atual
            if (user) {
              // Verificar se o testemunhal já foi lido pelo usuário atual
              const lidoPor = t.lido_por || [];
              const recorrente = t.recorrente || false;
              
              if (lidoPor.includes(user.id) && !recorrente) {
                return false;
              }
            }
            
            // Verificar se o horário agendado está dentro de 30 minutos
            if (t.horario_agendado) {
              const scheduledTimeParts = t.horario_agendado.split(':');
              if (scheduledTimeParts.length >= 2) {
                const scheduledHour = parseInt(scheduledTimeParts[0], 10);
                const scheduledMinute = parseInt(scheduledTimeParts[1], 10);
                
                if (!isNaN(scheduledHour) && !isNaN(scheduledMinute)) {
                  const scheduledDate = new Date();
                  scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
                  
                  const now = new Date();
                  const minutesUntil = differenceInMinutes(scheduledDate, now);
                  
                  // Verificar se é para hoje ou se é para amanhã (caso já tenha passado o horário hoje)
                  if (minutesUntil < 0) {
                    // Se já passou o horário hoje, verificar se é para amanhã
                    const tomorrowDate = new Date();
                    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                    tomorrowDate.setHours(scheduledHour, scheduledMinute, 0);
                    
                    const minutesUntilTomorrow = differenceInMinutes(tomorrowDate, now);
                    
                    // Não mostrar testemunhais de amanhã, mesmo que o programa seja o mesmo
                    return false;
                  }
                  
                  // Mostrar apenas se estiver dentro dos próximos 30 minutos
                  return minutesUntil >= 0 && minutesUntil <= 30;
                }
              }
            }
            
            return false;
          }) : [];
          
          console.log('Filtered testemunhais by day, date range, and read status:', filteredData);
          
          const processedData = await Promise.all(filteredData.map(async item => {
            try {
              if (!item || !item.horario_agendado || typeof item.horario_agendado !== 'string') {
                console.warn('Item inválido ou sem horário agendado:', item);
                return null;
              }
              
              const scheduledTimeParts = item.horario_agendado.split(':');
              if (scheduledTimeParts.length < 2) {
                console.warn('Formato de horário inválido:', item.horario_agendado);
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
              
              const isUpcoming = minutesUntil >= 0 && minutesUntil <= 30;
              const isExactTime = minutesUntil === 0;
              
              if (isExactTime && isMobileDevice()) {
                // Guardar testemunhais para o exato momento para notificação especial
                console.log('Testemunhal no horário exato detectado:', item);
              }
              
              if (typeof item === 'object' && item !== null) {
                return {
                  ...item,
                  id: item.id || `temp-${Date.now()}-${Math.random()}`,
                  texto: item.texto || "Sem texto disponível",
                  isUpcoming,
                  isExactTime,
                  minutesUntil,
                  tipo: 'testemunhal',
                  lido_por: item.lido_por || [],
                  recorrente: item.recorrente || false
                };
              } else {
                return null;
              }
            } catch (err) {
              console.error('Erro ao processar testemunhal:', err, item);
              return null;
            }
          }));
          
          const filteredProcessedData = processedData.filter(Boolean);
          
          // Identificar testemunhais que estão no horário exato para notificação especial
          const exactTimeItems = filteredProcessedData.filter(item => item.isExactTime);
          setExactTimeTestimonials(exactTimeItems);
          
          console.log('Filtered testemunhais:', filteredProcessedData);
          
          const sortedData = filteredProcessedData.sort((a, b) => {
            if (!a || !b) return 0;
            
            if (a.isUpcoming && !b.isUpcoming) return -1;
            if (!a.isUpcoming && b.isUpcoming) return 1;
            
            if (a.horario_agendado && b.horario_agendado) {
              return a.horario_agendado.localeCompare(b.horario_agendado);
            }
            
            return 0;
          });
          
          setTestemunhais(sortedData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar testemunhais:', error);
        toast.error('Erro ao carregar testemunhais', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setTestemunhais([]);
        setIsLoading(false);
      }
    };

    fetchTestemunhais();
    
    // Intervalo para buscar novos dados a cada 5 minutos
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        fetchTestemunhais();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Efeito para notificar quando testemunhais no horário exato são detectados
  useEffect(() => {
    if (exactTimeTestimonials.length > 0) {
      console.log('Notificando sobre testemunhais no horário exato:', exactTimeTestimonials);
      
      // Notificar com prioridade máxima - isso acorda a tela
      notifyUpcomingTestimonial(exactTimeTestimonials.length, true);
      
      // Vibrar com padrão mais intenso para indicar urgência
      if (isMobileDevice() && window.navigator.vibrate) {
        window.navigator.vibrate([300, 100, 300, 100, 500]);
      }
    }
  }, [exactTimeTestimonials]);
  
  // Intervalo para verificar testemunhais no horário exato
  useEffect(() => {
    const exactTimeCheckInterval = setInterval(() => {
      if (navigator.onLine && testemunhais.length > 0) {
        // Verificar todos os testemunhais para ver se algum está no exato momento atual
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        const exactTimeItems = testemunhais.filter(t => 
          t.horario_agendado === currentTimeString && t.status !== 'lido'
        );
        
        if (exactTimeItems.length > 0) {
          console.log('Testemunhais no horário exato detectados:', exactTimeItems);
          
          // Ativar notificação especial para testemunhais no horário exato
          notifyUpcomingTestimonial(exactTimeItems.length, true);
          
          // Vibrar com padrão mais intenso para indicar urgência
          if (isMobileDevice() && window.navigator.vibrate) {
            window.navigator.vibrate([300, 100, 300, 100, 500]);
          }
        }
      }
    }, 15 * 1000);
    
    return () => clearInterval(exactTimeCheckInterval);
  }, [testemunhais]);

  return { testemunhais, isLoading, exactTimeTestimonials, setTestemunhais };
}

// Helper function for calculating minutes difference
function differenceInMinutes(dateA: Date, dateB: Date): number {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}
