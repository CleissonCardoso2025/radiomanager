
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function useProgramScheduler() {
  const getCurrentProgram = async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
      
      // Get current day of week in Portuguese format
      const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      console.log(`Current day of week: ${dayOfWeek}`);
      
      // Map day names to database format
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
      console.log(`Current day name: ${currentDayName}, time: ${currentTime}`);
      
      // Find the current active program
      const { data: programsData, error: programsError } = await supabase
        .from('programas')
        .select('id, nome, horario_inicio, horario_fim, dias, apresentador')
        .order('horario_inicio', { ascending: true });
        
      if (programsError) {
        console.error('Error loading programs:', programsError);
        return { currentProgram: null, currentProgramId: 'error' };
      }
      
      console.log(`Retrieved ${programsData?.length || 0} programs`);
      programsData?.forEach((prog, idx) => {
        console.log(`Program ${idx+1}: ${prog.nome}, days: [${prog.dias?.join(', ')}], time: ${prog.horario_inicio}-${prog.horario_fim}`);
      });
      
      let currentProgram = null;
      
      if (programsData && programsData.length > 0) {
        currentProgram = programsData.find(program => {
          if (!program.horario_inicio || !program.horario_fim) {
            console.log(`Program ${program.id} has incomplete time data`);
            return false;
          }
          
          // Check if program runs today
          const dias = program.dias || [];
          if (!dias.includes(currentDayName)) {
            console.log(`Program ${program.nome} not scheduled for today (${currentDayName})`);
            return false;
          }
          
          const isWithinTimeRange = program.horario_inicio <= currentTime && program.horario_fim >= currentTime;
          if (isWithinTimeRange) {
            console.log(`Found active program: ${program.nome} (${program.horario_inicio}-${program.horario_fim})`);
          } else {
            console.log(`Program ${program.nome} not active at current time (${currentTime})`);
          }
          
          return isWithinTimeRange;
        });
      }
      
      if (!currentProgram) {
        console.log('No active program found for current day and time');
      }
      
      // Even if no program is active, still allow content display
      const currentProgramId = currentProgram?.id || 'no-active-program';
      
      return { currentProgram, currentProgramId };
    } catch (error) {
      console.error('Error determining current program:', error);
      toast.error('Erro ao determinar programa atual', {
        position: 'bottom-right',
        closeButton: true,
        duration: 3000
      });
      return { currentProgram: null, currentProgramId: 'error' };
    }
  };
  
  return { getCurrentProgram };
}
