import { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, notifyUpcomingTestimonial, playNotificationSound } from '@/services/notificationService';

export function useTestimonials(selectedProgram = null) {
  const [testemunhais, setTestemunhais] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exactTimeTestimonials, setExactTimeTestimonials] = useState<any[]>([]);
  const [lastProgramChange, setLastProgramChange] = useState<string | null>(null);
  const today = new Date();

  useEffect(() => {
    const fetchTestemunhais = async () => {
      try {
        setIsLoading(true);
        
        const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
        console.log('Current day of week:', dayOfWeek);
        
        const currentDate = format(today, 'yyyy-MM-dd');
        console.log('Current date:', currentDate);
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
        
        const { data: programsData, error: programsError } = await supabase
          .from('programas')
          .select('id, nome, horario_inicio, horario_fim')
          .filter('dias', 'cs', `{${dayOfWeek}}`)
          .order('horario_inicio', { ascending: true });
          
        let currentProgram = null;
        if (programsData && programsData.length > 0) {
          currentProgram = programsData.find(program => {
            if (!program.horario_inicio || !program.horario_fim) return false;
            return program.horario_inicio <= currentTime && program.horario_fim >= currentTime;
          });
        }
        
        const currentProgramId = currentProgram?.id || 'no-program';
        const programChanged = lastProgramChange !== currentProgramId;
        
        if (programChanged) {
          console.log('Program changed, updating testimonials...');
          setLastProgramChange(currentProgramId);
        } else if (testemunhais.length > 0 && !programChanged) {
          console.log('No program change detected, skipping testimonial update');
          setIsLoading(false);
          return;
        }
        
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
        
        const todayStr = format(today, 'yyyy-MM-dd');
        const localReadIds = JSON.parse(localStorage.getItem(`testemunhais_lidos_${todayStr}`) || '[]');
        
        const filteredData = data && Array.isArray(data) ? data.filter(t => {
          if (!t || !t.programas) return false;
          
          if (localReadIds.includes(t.id)) {
            console.log(`Testemunhal ${t.id} foi marcado como lido localmente hoje. Removendo da lista.`);
            return false;
          }
          
          if (selectedProgram && t.programa_id !== selectedProgram.id) {
            return false;
          }
          
          const dayOfWeek = today.getDay();
          const daysMap = {
            'domingo': 0,
            'segunda': 1,
            'terca': 2,
            'quarta': 3,
            'quinta': 4,
            'sexta': 5,
            'sabado': 6
          };
          
          const diasPrograma = t.programas.dias || [];
          const diasProgramaNumeros = diasPrograma.map(dia => {
            if (typeof dia !== 'string') return -1;
            return daysMap[dia.toLowerCase()] || -1;
          });
          
          console.log(`Programa: ${t.programas.nome}, Dias: ${diasPrograma}, Hoje: ${dayOfWeek}`);
          console.log(`Dias em números: ${diasProgramaNumeros}`);
          
          if (!diasProgramaNumeros.includes(dayOfWeek)) {
            console.log(`Testemunhal de ${t.programas.nome} não será exibido hoje (dia incorreto)`);
            return false;
          }
          
          let isWithinDateRange = true;
          
          if (t.data_inicio || t.data_fim) {
            if (t.data_inicio) {
              const startDateStr = t.data_inicio.toString();
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
            
            if (t.data_fim) {
              const endDateStr = t.data_fim.toString();
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
          
          if (!isWithinDateRange) {
            console.log(`Testemunhal ${t.id} fora do período de datas`);
            return false;
          }
          
          if (t.programas.horario_inicio && t.programas.horario_fim) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
            
            const [progStartHour, progStartMinute] = t.programas.horario_inicio.split(':').map(Number);
            const [progEndHour, progEndMinute] = t.programas.horario_fim.split(':').map(Number);
            
            const [testHour, testMinute] = (t.horario_agendado || '00:00').split(':').map(Number);
            
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            const progStartTotalMinutes = progStartHour * 60 + progStartMinute;
            const progEndTotalMinutes = progEndHour * 60 + progEndMinute;
            const testTotalMinutes = testHour * 60 + testMinute;
            
            const isProgramActive = currentTotalMinutes >= progStartTotalMinutes && 
                                   currentTotalMinutes <= progEndTotalMinutes;
            
            const isTestimonialWithinProgram = testTotalMinutes >= progStartTotalMinutes && 
                                             testTotalMinutes <= progEndTotalMinutes;
            
            const isTestimonialLate = testTotalMinutes < currentTotalMinutes;
            
            console.log(`Verificando horários para ${t.patrocinador}:`, {
              currentTime,
              programHorario: `${t.programas.horario_inicio} - ${t.programas.horario_fim}`,
              testimonialHorario: t.horario_agendado,
              isProgramActive,
              isTestimonialWithinProgram,
              isTestimonialLate
            });
            
            if (isTestimonialLate) {
              const minutesLate = currentTotalMinutes - testTotalMinutes;
              if (minutesLate > 15) {
                console.log(`Testemunhal ${t.id} está atrasado em ${minutesLate} minutos, não será exibido`);
                return false;
              }
            }
          }
          
          return true;
        }) : [];
        
        const filterByReadStatus = async (items) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return items;
            
            return items.filter(t => {
              const lidoPor = t.lido_por || [];
              
              if (lidoPor.includes(user.id)) {
                if (t.timestamp_leitura) {
                  const leituraDate = new Date(t.timestamp_leitura);
                  
                  if (isToday(leituraDate)) {
                    console.log(`Testemunhal ${t.id} foi lido hoje por ${user.id}. Removendo da lista.`);
                    const todayStr = format(today, 'yyyy-MM-dd');
                    const localReadIds = JSON.parse(localStorage.getItem(`testemunhais_lidos_${todayStr}`) || '[]');
                    if (!localReadIds.includes(t.id)) {
                      localReadIds.push(t.id);
                      localStorage.setItem(`testemunhais_lidos_${todayStr}`, JSON.stringify(localReadIds));
                    }
                    return false;
                  }
                }
                
                console.log(`Testemunhal ${t.id} foi lido em outro dia por ${user.id}. Mantendo na lista.`);
                return true;
              }
              
              return true;
            });
          } catch (err) {
            console.error('Error checking user auth status:', err);
            return items;
          }
        };
        
        filterByReadStatus(filteredData).then(readFilteredData => {
          console.log('Filtered testemunhais by read status:', readFilteredData);
          
          const processedData = readFilteredData.map(item => {
            try {
              if (!item) {
                console.warn('Item inválido:', item);
                return null;
              }
              
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
              
              const isUpcoming = minutesUntil >= -15 && minutesUntil <= 30;
              const isExactTime = minutesUntil === 0;
              
              if (isExactTime && isMobileDevice()) {
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
    
    const programChangeCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        fetchTestemunhais();
      }
    }, 60 * 1000);
    
    return () => {
      clearInterval(programChangeCheckInterval);
    };
  }, [selectedProgram]);

  useEffect(() => {
    if (exactTimeTestimonials.length > 0) {
      console.log('Notificando sobre testemunhais no horário exato:', exactTimeTestimonials);
      
      notifyUpcomingTestimonial(exactTimeTestimonials.length, true);
      
      if (isMobileDevice() && window.navigator.vibrate) {
        window.navigator.vibrate([300, 100, 300, 100, 500]);
      }
    }
  }, [exactTimeTestimonials]);
  
  useEffect(() => {
    const exactTimeCheckInterval = setInterval(() => {
      if (navigator.onLine && testemunhais.length > 0) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        const exactTimeItems = testemunhais.filter(t => 
          t.horario_agendado === currentTimeString && t.status !== 'lido'
        );
        
        if (exactTimeItems.length > 0) {
          console.log('Testemunhais no horário exato detectados:', exactTimeItems);
          
          notifyUpcomingTestimonial(exactTimeItems.length, true);
          
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

function differenceInMinutes(dateA: Date, dateB: Date): number {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}
