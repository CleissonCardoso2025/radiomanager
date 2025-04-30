
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
  
  return { getDayMap, differenceInMinutes };
}
