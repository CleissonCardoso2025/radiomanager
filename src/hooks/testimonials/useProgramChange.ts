
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function useProgramChange() {
  const [lastProgramChange, setLastProgramChange] = useState<string | null>(null);

  const checkForProgramChange = useCallback(async () => {
    try {
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      
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
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
      
      // Buscar programa atual
      const { data: programsData, error: programsError } = await supabase
        .from('programas')
        .select('id, nome, horario_inicio, horario_fim, dias, apresentador')
        .order('horario_inicio', { ascending: true });
        
      if (programsError) {
        console.error('Erro ao buscar programas:', programsError);
        return { programId: 'no-program' };
      }
      
      // Encontrar programa atual baseado no dia e horário
      let currentProgram = null;
      if (programsData && programsData.length > 0) {
        currentProgram = programsData.find(program => {
          if (!program.horario_inicio || !program.horario_fim) return false;
          
          // Verificar se o programa está programado para o dia atual
          const dias = program.dias || [];
          if (!dias.includes(currentDayName)) return false;
          
          // Verificar se estamos no horário do programa
          return program.horario_inicio <= currentTime && program.horario_fim >= currentTime;
        });
      }
      
      // Verificar se o programa mudou desde a última verificação
      const programId = currentProgram?.id || 'no-program';
      if (lastProgramChange !== programId) {
        setLastProgramChange(programId);
        console.log('Programa mudou, atualizando testemunhais');
      }
      
      return { programId, currentProgram };
    } catch (error) {
      console.error('Erro ao verificar mudança de programa:', error);
      return { programId: 'error' };
    }
  }, [lastProgramChange]);

  return { lastProgramChange, checkForProgramChange };
}
