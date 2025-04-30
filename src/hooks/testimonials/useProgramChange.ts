
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      
      console.log(`Checking for program change: date=${formattedDate}, day=${currentDayName}, time=${currentTime}`);
      
      // Buscar programa atual
      const { data: programsData, error: programsError } = await supabase
        .from('programas')
        .select('id, nome, horario_inicio, horario_fim, dias, apresentador')
        .order('horario_inicio', { ascending: true });
        
      if (programsError) {
        console.error('Error fetching programs:', programsError);
        return { programId: 'error', currentProgram: null };
      }
      
      console.log(`Retrieved ${programsData?.length || 0} programs`);
      
      // Encontrar programa atual baseado no dia e horário
      let currentProgram = null;
      if (programsData && programsData.length > 0) {
        currentProgram = programsData.find(program => {
          if (!program.horario_inicio || !program.horario_fim) {
            console.log(`Program ${program.id} has incomplete time data`);
            return false;
          }
          
          // Verificar se o programa está programado para o dia atual
          const dias = program.dias || [];
          if (!dias.includes(currentDayName)) {
            console.log(`Program ${program.nome} not scheduled for today (${currentDayName})`);
            return false;
          }
          
          // Verificar se estamos no horário do programa
          const isInTimeRange = program.horario_inicio <= currentTime && program.horario_fim >= currentTime;
          if (isInTimeRange) {
            console.log(`Current active program: ${program.nome} (${program.horario_inicio}-${program.horario_fim})`);
          }
          return isInTimeRange;
        });
      }
      
      // Even if no program is active, still allow content to be displayed
      const programId = currentProgram?.id || 'no-active-program';
      if (lastProgramChange !== programId) {
        console.log(`Program changed from ${lastProgramChange} to ${programId}`);
        setLastProgramChange(programId);
        
        if (!currentProgram) {
          console.log('No active program at the moment, but still allowing content display');
        }
      }
      
      return { programId, currentProgram };
    } catch (error) {
      console.error('Error checking for program change:', error);
      toast.error('Erro ao verificar mudança de programa', {
        position: 'bottom-right',
        closeButton: true,
        duration: 3000
      });
      return { programId: 'error', currentProgram: null };
    }
  }, [lastProgramChange]);

  return { lastProgramChange, checkForProgramChange };
}
