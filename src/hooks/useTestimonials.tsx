
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, notifyUpcomingTestimonial, playNotificationSound } from '@/services/notificationService';

export function useTestimonials(selectedProgram = null) {
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
          .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_inicio, data_fim, recorrente, lido_por, programas!inner(id, nome, dias, apresentador, horario_inicio, horario_fim), timestamp_leitura')
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
          setIsLoading(false);
          return;
        } 
        
        console.log('Raw testemunhais data:', data);
        
        const filteredData = data && Array.isArray(data) ? data.filter(t => {
          if (!t || !t.programas) return false;
          
          // Se o programa não for o selecionado e tivermos um programa selecionado, não mostrar
          if (selectedProgram && t.programa_id !== selectedProgram.id) {
            return false;
          }
          
          // Verificar se hoje é um dia em que o programa é transmitido
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
          
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
          const diasPrograma = t.programas.dias || [];
          const diasProgramaNumeros = diasPrograma.map(dia => {
            if (typeof dia !== 'string') return -1;
            return daysMap[dia.toLowerCase()] || -1;
          });
          
          console.log(`Programa: ${t.programas.nome}, Dias: ${diasPrograma}, Hoje: ${dayOfWeek}`);
          console.log(`Dias em números: ${diasProgramaNumeros}`);
          
          // Verificar se hoje é um dia válido para o programa
          if (!diasProgramaNumeros.includes(dayOfWeek)) {
            console.log(`Testemunhal de ${t.programas.nome} não será exibido hoje (dia incorreto)`);
            return false;
          }
          
          // Verificar se o testemunhal está dentro do período de exibição
          let isWithinDateRange = true;
          
          if (t.data_inicio || t.data_fim) {
            // Se data_inicio existe, verificar se a data atual é maior ou igual
            if (t.data_inicio) {
              const startDateStr = t.data_inicio.toString();
              // Converter para objetos Date para comparação
              const startDate = new Date(startDateStr);
              const todayDate = new Date(currentDate);
              
              isWithinDateRange = isWithinDateRange && (todayDate >= startDate);
              console.log(`Start date check for ${t.id}:`, { 
                currentDate, 
                startDate: startDateStr, 
                todayObj: todayDate, 
                startObj: startDate,
                result: (todayDate >= startDate) 
              });
            }
            
            // Se data_fim existe, verificar se a data atual é menor ou igual
            if (t.data_fim) {
              const endDateStr = t.data_fim.toString();
              // Converter para objetos Date para comparação
              const endDate = new Date(endDateStr);
              const todayDate = new Date(currentDate);
              
              isWithinDateRange = isWithinDateRange && (todayDate <= endDate);
              console.log(`End date check for ${t.id}:`, { 
                currentDate, 
                endDate: endDateStr,
                todayObj: todayDate, 
                endObj: endDate,
                result: (todayDate <= endDate) 
              });
            }
          }
          
          // Se não estiver dentro do período de datas, não mostrar
          if (!isWithinDateRange) {
            console.log(`Testemunhal ${t.id} fora do período de datas`);
            return false;
          }
          
          // Verificar se o horário está dentro do período do programa e do horário atual
          if (t.programas.horario_inicio && t.programas.horario_fim) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
            
            // Extrair horas e minutos do horário do programa
            const [progStartHour, progStartMinute] = t.programas.horario_inicio.split(':').map(Number);
            const [progEndHour, progEndMinute] = t.programas.horario_fim.split(':').map(Number);
            
            // Extrair horas e minutos do horário agendado do testemunhal
            const [testHour, testMinute] = (t.horario_agendado || '00:00').split(':').map(Number);
            
            // Converter para minutos desde meia-noite para facilitar a comparação
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            const progStartTotalMinutes = progStartHour * 60 + progStartMinute;
            const progEndTotalMinutes = progEndHour * 60 + progEndMinute;
            const testTotalMinutes = testHour * 60 + testMinute;
            
            // Verificar se o horário atual está dentro do período do programa
            const isProgramActive = currentTotalMinutes >= progStartTotalMinutes && 
                                   currentTotalMinutes <= progEndTotalMinutes;
            
            // Verificar se o horário agendado do testemunhal está dentro do período do programa
            const isTestimonialWithinProgram = testTotalMinutes >= progStartTotalMinutes && 
                                             testTotalMinutes <= progEndTotalMinutes;
            
            // Verificar se o testemunhal já passou do horário (está atrasado)
            const isTestimonialLate = testTotalMinutes < currentTotalMinutes;
            
            console.log(`Verificando horários para ${t.patrocinador}:`, {
              currentTime,
              programHorario: `${t.programas.horario_inicio} - ${t.programas.horario_fim}`,
              testimonialHorario: t.horario_agendado,
              isProgramActive,
              isTestimonialWithinProgram,
              isTestimonialLate
            });
            
            // MODIFICADO: Vamos mostrar testemunhais mesmo que não estejam dentro do horário exato do programa
            // para garantir que alguma coisa apareça na agenda
            /* 
            if (!isTestimonialWithinProgram) {
              console.log(`Testemunhal ${t.id} não será exibido (fora do horário do programa)`);
              return false;
            }
            */
            
            // Se o testemunhal já passou há mais de 15 minutos, não mostrar
            if (isTestimonialLate) {
              const minutesLate = currentTotalMinutes - testTotalMinutes;
              if (minutesLate > 15) {
                console.log(`Testemunhal ${t.id} está atrasado em ${minutesLate} minutos, não será exibido`);
                return false;
              }
            }
            
            // Se o programa não estiver ativo agora, verificar se está prestes a começar (30 minutos antes)
            if (!isProgramActive) {
              const minutesUntilProgram = progStartTotalMinutes - currentTotalMinutes;
              // MODIFICADO: Vamos mostrar testemunhais mesmo que o programa não comece em breve
              // apenas para garantir que algo apareça na agenda
              /*
              // Se o programa começar em até 30 minutos, mostrar os testemunhais
              if (minutesUntilProgram > 0 && minutesUntilProgram <= 30) {
                console.log(`Programa ${t.programas.nome} começará em ${minutesUntilProgram} minutos, exibindo testemunhal`);
                // Continuar e mostrar
              } else {
                console.log(`Testemunhal ${t.id} não será exibido (programa não está ativo e não começa em breve)`);
                return false;
              }
              */
            }
          }
          
          return true;
        }) : [];
        
        console.log('Filtered testemunhais by day, date range, program time:', filteredData);
        
        // Now do a separate async operation to filter by read status
        const filterByReadStatus = async (items) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return items;
            
            return items.filter(t => {
              const lidoPor = t.lido_por || [];
              
              // Manter apenas os itens NÃO lidos por este usuário
              return !lidoPor.includes(user.id);
            });
          } catch (err) {
            console.error('Error checking user auth status:', err);
            return items;
          }
        };
        
        // Apply the second filter and then process the data
        filterByReadStatus(filteredData).then(readFilteredData => {
          console.log('Filtered testemunhais by read status:', readFilteredData);
          
          const processedData = readFilteredData.map(item => {
            try {
              if (!item) {
                console.warn('Item inválido:', item);
                return null;
              }
              
              // Garantir que horario_agendado seja uma string válida
              const horarioAgendado = typeof item.horario_agendado === 'string' ? item.horario_agendado : '00:00';
              
              const scheduledTimeParts = horarioAgendado.split(':');
              if (scheduledTimeParts.length < 2) {
                console.warn('Formato de horário inválido:', horarioAgendado);
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
          }).filter(Boolean);
          
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
          setIsLoading(false);
        });
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
  }, [selectedProgram]);

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
