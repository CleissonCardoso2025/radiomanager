
import { useState, useEffect, useCallback } from 'react';
import { useTestimonialFetcher } from './useTestimonialFetcher';
import { useTestimonialProcessor } from './useTestimonialProcessor';
import { useProgramChange } from './useProgramChange';
import { playNotificationSound, isMobileDevice } from '@/services/notificationService';

export function useTestimonials(selectedProgramId = null) {
  const [testemunhais, setTestemunhais] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exactTimeTestimonials, setExactTimeTestimonials] = useState<any[]>([]);
  
  const { lastProgramChange, checkForProgramChange } = useProgramChange();
  const { fetchTestimonials } = useTestimonialFetcher();
  const { processTestimonials } = useTestimonialProcessor();

  const fetchTestemunhais = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current program information
      const { programId } = await checkForProgramChange();
      
      // Fetch testimonials
      const { allData, error } = await fetchTestimonials();
      
      if (error) {
        console.error('Erro ao buscar testemunhais:', error);
        setTestemunhais([]);
        setExactTimeTestimonials([]);
        setIsLoading(false);
        return;
      }
      
      // Process testimonials
      const { processedTestimonials, exactTimeItems } = await processTestimonials(allData);
      
      // Update state with processed testimonials
      setTestemunhais(processedTestimonials);
      setExactTimeTestimonials(exactTimeItems);
      setIsLoading(false);
      
      console.log('Testemunhais processados finais:', processedTestimonials.length);
      console.log('Testemunhais no horário exato:', exactTimeItems.length);
      
    } catch (error) {
      console.error('Erro ao carregar testemunhais:', error);
      setTestemunhais([]);
      setExactTimeTestimonials([]);
      setIsLoading(false);
    }
  }, [checkForProgramChange, fetchTestimonials, processTestimonials]);

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
