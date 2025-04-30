
import { useCallback } from 'react';

export function useTestimonialUtils() {
  const getDayMap = useCallback(() => {
    return {
      0: 'domingo',
      1: 'segunda', 
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      6: 'sabado'
    };
  }, []);
  
  const differenceInMinutes = useCallback((dateA: Date, dateB: Date): number => {
    return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60));
  }, []);
  
  const formatTime = useCallback((date: Date): string => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }, []);
  
  const parseTimeString = useCallback((timeStr: string): { hours: number, minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }, []);
  
  return { getDayMap, differenceInMinutes, formatTime, parseTimeString };
}
