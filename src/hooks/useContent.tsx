
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';

// Helper function for calculating minutes difference
function differenceInMinutes(dateA: Date, dateB: Date): number {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}

export function useContent() {
  const [conteudos, setConteudos] = useState([]);
  const [lastProgramChange, setLastProgramChange] = useState<string | null>(null);
  const today = new Date();

  useEffect(() => {
    const fetchConteudosProduzidos = async () => {
      try {
        const { error: checkError } = await supabase
          .from('conteudos_produzidos')
          .select('count')
          .limit(1);
          
        if (checkError && checkError.code === '42P01') {
          console.error('Tabela conteudos_produzidos não existe:', checkError);
          setConteudos([]);
          return;
        }
        
        const dataAtual = format(today, 'yyyy-MM-dd');
        console.log('Data atual para conteúdos:', dataAtual);
        
        // Get the current time to detect program changes
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
        
        // Find the current active program
        const { data: programsData, error: programsError } = await supabase
          .from('programas')
          .select('id, nome, horario_inicio, horario_fim, dias')
          .order('horario_inicio', { ascending: true });
          
        let currentProgram = null;
        const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
        
        // Map day names to numbers
        const daysMap = {
          0: 'domingo',
          1: 'segunda', 
          2: 'terca',
          3: 'quarta',
          4: 'quinta',
          5: 'sexta',
          6: 'sabado'
        };
        
        if (programsData && programsData.length > 0) {
          currentProgram = programsData.find(program => {
            if (!program.horario_inicio || !program.horario_fim) return false;
            
            // Check if program runs today - ensure dias exists before accessing it
            const dias = program.dias || [];
            if (!dias.includes(daysMap[dayOfWeek])) return false;
            
            return program.horario_inicio <= currentTime && program.horario_fim >= currentTime;
          });
        }
        
        // Check if there's been a program change
        const currentProgramId = currentProgram?.id || 'no-program';
        const programChanged = lastProgramChange !== currentProgramId;
        
        if (programChanged) {
          console.log('Program changed, updating content...');
          setLastProgramChange(currentProgramId);
        } else if (conteudos.length > 0 && !programChanged) {
          console.log('No program change detected, skipping content update');
          return; // Skip update if no program change
        }
        
        // Obter usuário atual de forma assíncrona
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            console.error('Usuário não autenticado');
            return;
          }
          
          const todayStr = format(today, 'yyyy-MM-dd');
          const localReadContentIds = JSON.parse(localStorage.getItem(`conteudos_lidos_${todayStr}`) || '[]');
          
          const { data, error } = await supabase
            .from('conteudos_produzidos')
            .select('*, programas(id, nome, apresentador, dias, horario_inicio, horario_fim)')
            .eq('data_programada', dataAtual)
            .order('horario_programado', { ascending: true });
          
          if (error) {
            console.error('Erro ao carregar conteúdos produzidos:', error);
            
            toast.error('Erro ao carregar conteúdos produzidos', {
              description: error.message,
              position: 'bottom-right',
              closeButton: true,
              duration: 5000
            });
            setConteudos([]);
            return;
          }
          
          console.log('Conteúdos produzidos para hoje:', data);
          
          const filteredData = data && Array.isArray(data) ? data.filter(item => {
            if (!item || !item.programas) return false;
            
            // Skip content that's been marked as read locally today
            if (localReadContentIds.includes(item.id)) {
              console.log(`Conteúdo ${item.id} foi marcado como lido localmente. Removendo da lista.`);
              return false;
            }
            
            // Verificar se data_fim está definida e se a data atual está dentro do intervalo
            if (item.data_fim) {
              const dataFim = new Date(item.data_fim);
              const dataAtualObj = new Date(dataAtual);
              
              // Se a data atual for posterior à data_fim, não mostrar o conteúdo
              if (dataAtualObj > dataFim) {
                console.log(`Conteúdo ${item.id} não será exibido (fora do período de validade)`);
                return false;
              }
            }
            
            // Verificar se hoje é um dia em que o programa é transmitido
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
            const diasPrograma = item.programas.dias || [];
            
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
            const diasProgramaNumeros = diasPrograma.map(dia => 
              typeof dia === 'string' ? (daysMap[dia.toLowerCase()] || -1) : -1
            );
            
            console.log(`Conteúdo para programa: ${item.programas.nome}, Dias: ${diasPrograma}, Hoje: ${dayOfWeek}`);
            console.log(`Dias em números: ${diasProgramaNumeros}`);
            
            // MODIFICADO: Vamos mostrar conteúdos mesmo que não seja o dia correto do programa
            // para garantir que algo apareça na agenda
            /*
            if (!diasProgramaNumeros.includes(dayOfWeek)) {
              // Se hoje não for um dia em que o programa é transmitido, não mostrar
              console.log(`Conteúdo de ${item.programas.nome} não será exibido hoje (dia incorreto)`);
              return false;
            }
            */
            
            // Verificar se o horário atual está dentro do período do programa
            if (item.programas.horario_inicio && item.programas.horario_fim && item.horario_programado) {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
              
              // Extrair horas e minutos do horário do programa
              const [progStartHour, progStartMinute] = item.programas.horario_inicio.split(':').map(Number);
              const [progEndHour, progEndMinute] = item.programas.horario_fim.split(':').map(Number);
              
              // Extrair horas e minutos do horário programado do conteúdo
              const [contentHour, contentMinute] = item.horario_programado.split(':').map(Number);
              
              // Converter para minutos desde meia-noite para facilitar a comparação
              const currentTotalMinutes = currentHour * 60 + currentMinute;
              const progStartTotalMinutes = progStartHour * 60 + progStartMinute;
              const progEndTotalMinutes = progEndHour * 60 + progEndMinute;
              const contentTotalMinutes = contentHour * 60 + contentMinute;
              
              // Verificar se o horário atual está dentro do período do programa
              const isProgramActive = currentTotalMinutes >= progStartTotalMinutes && 
                                    currentTotalMinutes <= progEndTotalMinutes;
              
              // Verificar se o horário programado do conteúdo está dentro do período do programa
              const isContentWithinProgram = contentTotalMinutes >= progStartTotalMinutes && 
                                           contentTotalMinutes <= progEndTotalMinutes;
              
              // Verificar se o conteúdo já passou do horário (está atrasado)
              const isContentLate = contentTotalMinutes < currentTotalMinutes;
              
              console.log(`Verificando horários para conteúdo ${item.nome}:`, {
                currentTime,
                programHorario: `${item.programas.horario_inicio} - ${item.programas.horario_fim}`,
                contentHorario: item.horario_programado,
                isProgramActive,
                isContentWithinProgram,
                isContentLate
              });
              
              // MODIFICADO: Vamos mostrar conteúdos mesmo que não estejam dentro do horário do programa
              // para garantir que algo apareça na agenda
              /*
              // Mostrar somente conteúdos que:
              // 1. Estão dentro do período do programa
              // 2. O programa está ativo no momento OU vai começar em até 30 minutos
              // 3. O conteúdo está por vir OU recém atrasado (até 15 minutos)
              if (!isContentWithinProgram) {
                console.log(`Conteúdo ${item.id} não será exibido (fora do horário do programa)`);
                return false;
              }
              */
              
              // Se o conteúdo já passou há mais de 15 minutos, não mostrar
              if (isContentLate) {
                const minutesLate = currentTotalMinutes - contentTotalMinutes;
                if (minutesLate > 15) {
                  console.log(`Conteúdo ${item.id} está atrasado em ${minutesLate} minutos, não será exibido`);
                  return false;
                }
              }
              
              // MODIFICADO: Vamos mostrar conteúdos mesmo que o programa não esteja ativo ou não comece em breve
              // para garantir que algo apareça na agenda
              /*
              // Se o programa não estiver ativo agora, verificar se está prestes a começar (30 minutos antes)
              if (!isProgramActive) {
                const minutesUntilProgram = progStartTotalMinutes - currentTotalMinutes;
                // Se o programa começar em até 30 minutos, mostrar os conteúdos
                if (minutesUntilProgram > 0 && minutesUntilProgram <= 30) {
                  console.log(`Programa ${item.programas.nome} começará em ${minutesUntilProgram} minutos, exibindo conteúdo`);
                  // Continuar e mostrar
                } else {
                  console.log(`Conteúdo ${item.id} não será exibido (programa não está ativo e não começa em breve)`);
                  return false;
                }
              }
              */
            }
            
            return true;
          }) : [];
          
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
          
          const sortedData = processedData.sort((a, b) => {
            if (!a || !b) return 0;
            
            if (a.isUpcoming && !b.isUpcoming) return -1;
            if (!a.isUpcoming && b.isUpcoming) return 1;
            
            if (a.horario_programado && b.horario_programado) {
              return a.horario_programado.localeCompare(b.horario_programado);
            }
            
            return 0;
          });
          
          setConteudos(sortedData);
        } catch (authError) {
          console.error('Erro ao obter usuário:', authError);
          setConteudos([]);
        }
      } catch (error) {
        console.error('Erro ao carregar conteúdos produzidos:', error);
        toast.error('Erro ao carregar conteúdos produzidos', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setConteudos([]);
      }
    };

    fetchConteudosProduzidos();
    
    // Check for program changes every minute
    const programChangeCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        fetchConteudosProduzidos();
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(programChangeCheckInterval);
    };
  }, []);

  return { conteudos, setConteudos };
}
