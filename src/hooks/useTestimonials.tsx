import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice } from '@/services/notificationService';

export function useTestimonials(selectedProgramId = null) {
  const [testemunhais, setTestemunhais] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exactTimeTestimonials, setExactTimeTestimonials] = useState<any[]>([]);
  const [lastProgramChange, setLastProgramChange] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestemunhais = async () => {
      try {
        setIsLoading(true);
        
        const currentDate = new Date();
        const dayOfWeek = format(currentDate, 'EEEE', { locale: ptBR });
        console.log('Current day of week:', dayOfWeek);
        
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        console.log('Current date:', formattedDate);
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
        
        // Buscar programa atual
        const { data: programsData, error: programsError } = await supabase
          .from('programas')
          .select('id, nome, horario_inicio, horario_fim')
          .filter('dias', 'cs', `{${dayOfWeek}}`)
          .order('horario_inicio', { ascending: true });
          
        if (programsError) {
          console.error('Erro ao buscar programas:', programsError);
          setIsLoading(false);
          return;
        }
        
        let currentProgram = null;
        if (programsData && programsData.length > 0) {
          currentProgram = programsData.find(program => {
            if (!program.horario_inicio || !program.horario_fim) return false;
            return program.horario_inicio <= currentTime && program.horario_fim >= currentTime;
          });
        }
        
        if (!currentProgram) {
          console.log('Nenhum programa ativo no momento');
          setTestemunhais([]);
          setIsLoading(false);
          return;
        }
        
        console.log('Programa atual:', currentProgram);
        
        // Verificar se o programa mudou desde a última verificação
        const programId = currentProgram.id;
        if (lastProgramChange !== programId) {
          setLastProgramChange(programId);
          console.log('Programa mudou, atualizando testemunhais');
        }
        
        // Buscar testemunhais recorrentes
        let recurringData = [];
        const { data: recurringResponse, error: recurringError } = await supabase
          .from('testemunhais')
          .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_fim, recorrente, lido_por, programas!inner(id, nome, dias, apresentador, horario_inicio, horario_fim), timestamp_leitura')
          .eq('recorrente', true)
          .eq('programa_id', currentProgram.id)
          .order('horario_agendado', { ascending: true });
          
        if (recurringError) {
          console.error('Erro ao buscar testemunhais recorrentes:', recurringError);
        } else {
          recurringData = recurringResponse || [];
          console.log('Testemunhais recorrentes:', recurringData);
        }
        
        // Buscar testemunhais regulares (não recorrentes)
        let regularData = [];
        const { data: regularResponse, error: regularError } = await supabase
          .from('testemunhais')
          .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_fim, recorrente, lido_por, programas!inner(id, nome, dias, apresentador, horario_inicio, horario_fim), timestamp_leitura')
          .eq('recorrente', false)
          .eq('programa_id', currentProgram.id)
          .is('data_fim', null)
          .order('horario_agendado', { ascending: true });
          
        if (regularError) {
          console.error('Erro ao buscar testemunhais regulares:', regularError);
        } else {
          regularData = regularResponse || [];
          console.log('Testemunhais regulares:', regularData);
        }
        
        // Buscar testemunhais com período de validade
        let validityData = [];
        if (currentProgram) {
          const { data: validityResponse, error: validityError } = await supabase
            .from('testemunhais')
            .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_fim, recorrente, lido_por, programas!inner(id, nome, dias, apresentador, horario_inicio, horario_fim), timestamp_leitura')
            .not('data_fim', 'is', null)
            .gte('data_fim', formattedDate)
            .eq('programa_id', currentProgram.id)
            .order('horario_agendado', { ascending: true });
            
          validityData = validityResponse || [];
          if (validityError) {
            console.error('Erro ao buscar testemunhais com validade:', validityError);
          }
        } else {
          console.log('Nenhum programa ativo no momento, não buscaremos testemunhais com período de validade');
        }
          
        console.log('Testemunhais com período de validade do programa atual:', validityData);
        
        // Combinar os resultados e remover duplicatas
        const allData = [
          ...(recurringData || []),
          ...(regularData || []),
          ...(validityData || [])
        ];
        
        // Remover duplicatas com base no ID
        const uniqueIds = new Set();
        const data = allData.filter(item => {
          if (!item || uniqueIds.has(item.id)) return false;
          uniqueIds.add(item.id);
          return true;
        });
        
        // Obter usuário antes do filtro principal
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        
        // Filtro principal
        let filteredData = data.filter(t => {
          if (!t.programas || !t.programas.horario_inicio || !t.programas.horario_fim) return false;
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
          
          // Filtro de datas: data_inicio <= hoje <= data_fim (ou se data_fim não existe, apenas data_inicio <= hoje)
          const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const dataInicio = t.data_inicio ? new Date(t.data_inicio) : null;
          const dataFim = t.data_fim ? new Date(t.data_fim) : null;
          
          if (dataInicio && hoje < new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate())) return false;
          if (dataFim && hoje > new Date(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate())) return false;
          
          // Horário atual deve estar dentro do horário do programa ativo
          if (currentTime < t.programas.horario_inicio || currentTime > t.programas.horario_fim) return false;
          
          // Verificar se o programa está programado para o dia atual
          if (t.programas.dias && Array.isArray(t.programas.dias)) {
            const dayOfWeek = format(now, 'EEEE', { locale: ptBR });
            if (!t.programas.dias.includes(dayOfWeek)) return false;
          }
          
          // Verificar se o programa já começou
          const progStartParts = t.programas.horario_inicio.split(':');
          const progStartTotalMinutes = parseInt(progStartParts[0], 10) * 60 + parseInt(progStartParts[1], 10);
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
          if (currentTotalMinutes < progStartTotalMinutes) return false;
          
          // Filtro de lidos pelo usuário (localStorage será filtrado depois)
          if (user && t.lido_por && Array.isArray(t.lido_por) && t.lido_por.includes(user.id)) return false;
          
          return true;
        });
        
        // Filtro localStorage (testemunhais lidos hoje)
        const localReadIds = JSON.parse(localStorage.getItem(`testemunhais_lidos_${formattedDate}`) || '[]');
        const filtered = filteredData.filter(t => !localReadIds.includes(t.id));
        
        // Atualizar o estado com os dados filtrados
        setTestemunhais(filtered);
        
        // Calcular testemunhais no horário exato
        const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const exactTimeItems = filtered.filter(t => 
          t.horario_agendado === currentTimeString && t.status !== 'lido'
        );
        
        setExactTimeTestimonials(exactTimeItems);
        setIsLoading(false);
        
        console.log('Testemunhais filtrados:', filtered);
        console.log('Testemunhais no horário exato:', exactTimeItems);
        
      } catch (error) {
        console.error('Erro ao carregar testemunhais:', error);
        toast.error('Erro ao carregar testemunhais', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setTestemunhais([]);
        setExactTimeTestimonials([]);
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
  }, [selectedProgramId, lastProgramChange]);

  return { testemunhais, isLoading, exactTimeTestimonials, setTestemunhais };
}

function differenceInMinutes(dateA: Date, dateB: Date): number {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}
