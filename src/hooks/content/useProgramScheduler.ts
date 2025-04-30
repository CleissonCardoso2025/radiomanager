
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useProgramScheduler() {
  const getCurrentProgram = async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`;
      
      // Get current day of week in Portuguese format
      const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      console.log(`Dia da semana atual: ${dayOfWeek}`);
      
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
      console.log(`Nome do dia atual: ${currentDayName}`);
      
      // Find the current active program
      const { data: programsData, error: programsError } = await supabase
        .from('programas')
        .select('id, nome, horario_inicio, horario_fim, dias, apresentador')
        .order('horario_inicio', { ascending: true });
        
      if (programsError) {
        console.error('Erro ao carregar programas:', programsError);
        return { currentProgram: null, currentProgramId: 'no-program' };
      }
      
      console.log(`Programas obtidos: ${programsData?.length || 0}`);
      programsData?.forEach((prog, idx) => {
        console.log(`Programa ${idx+1}: ${prog.nome}, dias: [${prog.dias?.join(', ')}], horário: ${prog.horario_inicio}-${prog.horario_fim}`);
      });
      
      let currentProgram = null;
      
      if (programsData && programsData.length > 0) {
        currentProgram = programsData.find(program => {
          if (!program.horario_inicio || !program.horario_fim) return false;
          
          // Check if program runs today
          const dias = program.dias || [];
          if (!dias.includes(currentDayName)) {
            console.log(`Programa ${program.nome} não está programado para hoje (${currentDayName})`);
            return false;
          }
          
          const isWithinTimeRange = program.horario_inicio <= currentTime && program.horario_fim >= currentTime;
          if (!isWithinTimeRange) {
            console.log(`Programa ${program.nome} não está no horário atual (${currentTime})`);
            return false;
          }
          
          console.log(`Programa ${program.nome} está ativo agora!`);
          return true;
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
