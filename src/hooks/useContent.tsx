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
          .select('*, programas(id, nome, apresentador)')
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
