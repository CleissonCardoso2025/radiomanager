
import { useState, useEffect, useCallback } from 'react';
import { useTestimonialFetcher } from './useTestimonialFetcher';
import { useTestimonialProcessor } from './useTestimonialProcessor';
import { useProgramChange } from './useProgramChange';
import { playNotificationSound, isMobileDevice } from '@/services/notificationService';
import { toast } from 'sonner';

export function useTestimonials(selectedProgramId = null) {
  const [testemunhais, setTestemunhais] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exactTimeTestimonials, setExactTimeTestimonials] = useState<any[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  const { lastProgramChange, checkForProgramChange } = useProgramChange();
  const { fetchTestimonials } = useTestimonialFetcher();
  const { processTestimonials } = useTestimonialProcessor();

  const fetchTestemunhais = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching testimonials...');
      
      // Get current program information but don't exit if no program is active
      const { programId } = await checkForProgramChange();
      console.log(`Current program ID: ${programId}`);
      
      // Fetch testimonials
      const { allData, error } = await fetchTestimonials();
      
      if (error) {
        console.error('Error fetching testimonials:', error);
        toast.error('Erro ao buscar testemunhais', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setTestemunhais([]);
        setExactTimeTestimonials([]);
        setIsLoading(false);
        return;
      }
      
      if (!allData || allData.length === 0) {
        console.log('No testimonials received from database');
        setTestemunhais([]);
        setExactTimeTestimonials([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Received ${allData.length} testimonials from database`);
      
      // Process testimonials
      const { processedTestimonials, exactTimeItems } = await processTestimonials(allData);
      
      // Update state with processed testimonials
      setTestemunhais(processedTestimonials);
      setExactTimeTestimonials(exactTimeItems);
      setLastFetchTime(new Date());
      setIsLoading(false);
      
      console.log(`Final processed testimonials: ${processedTestimonials.length}`);
      console.log(`Exact time testimonials: ${exactTimeItems.length}`);
      
      // Notify for exact time items
      if (exactTimeItems.length > 0 && isMobileDevice()) {
        playNotificationSound('alert');
        toast.info(`${exactTimeItems.length} testemunhais para o horário atual!`);
      }
      
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast.error('Erro ao carregar testemunhais', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      setTestemunhais([]);
      setExactTimeTestimonials([]);
      setIsLoading(false);
    }
  }, [checkForProgramChange, fetchTestimonials, processTestimonials]);

  useEffect(() => {
    console.log('Initializing testimonials hook');
    fetchTestemunhais();
    
    const programChangeCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        console.log('Scheduled testimonial refresh triggered');
        fetchTestemunhais();
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(programChangeCheckInterval);
    };
  }, [fetchTestemunhais]);

  return { 
    testemunhais, 
    isLoading, 
    exactTimeTestimonials, 
    setTestemunhais,
    lastFetchTime,
    refreshTestimonials: fetchTestemunhais 
  };
}
