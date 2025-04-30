
import { useState, useEffect, useCallback } from 'react';
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

  const fetchTestemunhais = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      
      // Map day names
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
      console.log('Current day of week:', currentDayName);
      
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      console.log('Current date:', formattedDate);
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Buscar programa atual
      const { data: programsData, error: programsError } = await supabase
        .from('programas')
        .select('id, nome, horario_inicio, horario_fim, dias, apresentador')
        .order('horario_inicio', { ascending: true });
        
      if (programsError) {
        console.error('Erro ao buscar programas:', programsError);
        setIsLoading(false);
        return;
      }
      
      console.log(`Programas obtidos: ${programsData?.length || 0}`);
      programsData?.forEach((prog, idx) => {
        console.log(`Programa ${idx+1}: ${prog.nome}, dias: [${prog.dias?.join(', ')}], horário: ${prog.horario_inicio}-${prog.horario_fim}`);
      });
      
      let currentProgram = null;
      if (programsData && programsData.length > 0) {
        currentProgram = programsData.find(program => {
          if (!program.horario_inicio || !program.horario_fim) return false;
          
          // Verificar se o programa está programado para o dia atual
          const dias = program.dias || [];
          if (!dias.includes(currentDayName)) return false;
          
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
        console.log('Testemunhais recorrentes:', recurringData.length);
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
        console.log('Testemunhais regulares:', regularData.length);
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
        
      console.log('Testemunhais com período de validade do programa atual:', validityData.length);
      
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
      
      console.log('Total de testemunhais após remover duplicatas:', data.length);
      
      // Obter usuário antes do filtro principal
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      // Filtro principal
      let filteredData = data.filter(t => {
        // Adicionar campo tipo para todos os testemunhais
        t.tipo = 'testemunhal';
        
        if (!t.programas || !t.programas.horario_inicio || !t.programas.horario_fim) return false;
        
        // Verificar se o programa já começou
        const progStartParts = t.programas.horario_inicio.split(':');
        const progStartTotalMinutes = parseInt(progStartParts[0], 10) * 60 + parseInt(progStartParts[1], 10);
        
        // Filtro de lidos pelo usuário
        if (user && t.lido_por && Array.isArray(t.lido_por) && t.lido_por.includes(user.id)) {
          console.log(`Testemunhal ${t.id} já foi lido pelo usuário atual`);
          return false;
        }
        
        return true;
      });
      
      // Filtro localStorage (testemunhais lidos hoje)
      const localReadIds = JSON.parse(localStorage.getItem(`testemunhais_lidos_${formattedDate}`) || '[]');
      const filtered = filteredData.filter(t => !localReadIds.includes(t.id));
      
      console.log('Testemunhais após filtro de lidos localmente:', filtered.length);
      
      // Processar os testemunhais para adicionar informações de hora exata
      const processedTestimonials = filtered.map(t => {
        // Verificar se é hora exata
        const testimonialTime = t.horario_agendado || '00:00';
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const isExactTime = testimonialTime === currentTimeStr;
        
        // Calcular minutos até o horário agendado
        const [testHour, testMinute] = testimonialTime.split(':').map(Number);
        const testTotalMinutes = testHour * 60 + testMinute;
        const minutesUntil = testTotalMinutes - currentTotalMinutes;
        
        // Determinar se é próximo (dentro de 30 minutos)
        const isUpcoming = minutesUntil >= -15 && minutesUntil <= 30;
        
        return {
          ...t,
          isExactTime,
          isUpcoming,
          minutesUntil
        };
      });
      
      // Atualizar o estado com os dados filtrados
      setTestemunhais(processedTestimonials);
      
      // Calcular testemunhais no horário exato
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const exactTimeItems = processedTestimonials.filter(t => 
        t.horario_agendado === currentTimeString && t.status !== 'lido'
      );
      
      setExactTimeTestimonials(exactTimeItems);
      setIsLoading(false);
      
      console.log('Testemunhais processados finais:', processedTestimonials.length);
      console.log('Testemunhais no horário exato:', exactTimeItems.length);
      
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
  }, [lastProgramChange]);

  useEffect(() => {
    fetchTestemunhais();
    
    const programChangeCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        fetchTestemunhais();
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(programChangeCheckInterval);
    };
  }, [fetchTestemunhais]);

  return { testemunhais, isLoading, exactTimeTestimonials, setTestemunhais };
}

function differenceInMinutes(dateA: Date, dateB: Date): number {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
}
