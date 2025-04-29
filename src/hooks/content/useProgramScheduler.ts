
import { supabase } from '@/integrations/supabase/client';

export function useProgramScheduler() {
  const getCurrentProgram = async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
      
      // Find the current active program
      const { data: programsData, error: programsError } = await supabase
        .from('programas')
        .select('id, nome, horario_inicio, horario_fim, dias, apresentador')
        .order('horario_inicio', { ascending: true });
        
      if (programsError) {
        console.error('Erro ao carregar programas:', programsError);
        return { currentProgram: null, currentProgramId: 'no-program' };
      }
      
      let currentProgram = null;
      const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      
      // Map day names to numbers
      const daysMap: Record<number, string> = {
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
      
      const currentProgramId = currentProgram?.id || 'no-program';
      return { currentProgram, currentProgramId };
    } catch (error) {
      console.error('Erro ao determinar programa atual:', error);
      return { currentProgram: null, currentProgramId: 'error' };
    }
  };
  
  return { getCurrentProgram };
}
