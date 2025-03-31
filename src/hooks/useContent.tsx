
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';

export function useContent() {
  const [conteudos, setConteudos] = useState([]);
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
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('Usuário não autenticado');
          return;
        }
        
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
          
          if (!diasProgramaNumeros.includes(dayOfWeek)) {
            // Se hoje não for um dia em que o programa é transmitido, não mostrar
            console.log(`Conteúdo de ${item.programas.nome} não será exibido hoje (dia incorreto)`);
            return false;
          }
          
          // Verificar se o horário atual está dentro do período do programa
          if (item.programas.horario_inicio && item.programas.horario_fim && item.horario_programado) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
            
            // Verificar se o horário atual está dentro do período do programa
            const isProgramActive = currentTime >= item.programas.horario_inicio && currentTime <= item.programas.horario_fim;
            
            // Verificar se o horário programado do conteúdo está dentro do período do programa
            const isContentWithinProgram = item.horario_programado >= item.programas.horario_inicio && item.horario_programado <= item.programas.horario_fim;
            
            // Só mostrar se o programa estiver ativo e o conteúdo estiver dentro do período do programa
            if (!isProgramActive || !isContentWithinProgram) {
              return false;
            }
          }
          
          // Verificar status e recorrência
          if (item.status !== 'lido') return true;
          if (item.recorrente) return true;
          if (item.lido_por && Array.isArray(item.lido_por) && !item.lido_por.includes(user.id)) {
            return true;
          }
          return false;
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
            
            const isUpcoming = minutesUntil >= 0 && minutesUntil <= 30;
            
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
              recorrente: item.recorrente || false
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
    
    // Intervalo para buscar novos dados a cada 5 minutos
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        fetchConteudosProduzidos();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { conteudos, setConteudos };
}

// Helper function for calculating minutes difference
function differenceInMinutes(dateA: Date, dateB: Date): number {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}
