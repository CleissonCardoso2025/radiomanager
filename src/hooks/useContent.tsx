
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';
import { useContentFetcher } from './content/useContentFetcher';
import { useContentProcessor } from './content/useContentProcessor';
import { useProgramScheduler } from './content/useProgramScheduler';

export function useContent() {
  const [conteudos, setConteudos] = useState([]);
  const [lastProgramChange, setLastProgramChange] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  const { fetchConteudos } = useContentFetcher();
  const { processContentItems } = useContentProcessor();
  const { getCurrentProgram } = useProgramScheduler();

  const updateContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const dataAtual = format(new Date(), 'yyyy-MM-dd');
      console.log('Current date for content:', dataAtual);
      
      // Get current program - continue even if no active program
      const { currentProgram, currentProgramId } = await getCurrentProgram();
      console.log('Current program:', currentProgram, 'ID:', currentProgramId);
      
      // Always update content, regardless of program changes
      console.log('Updating content...');
      setLastProgramChange(currentProgramId);
      
      // Fetch content
      const { data, error, localReadContentIds } = await fetchConteudos(dataAtual);
      
      if (error) {
        console.error('Error loading produced content:', error);
        toast.error('Erro ao carregar conteúdos produzidos', {
          description: error.message,
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setConteudos([]);
        setIsLoading(false);
        return;
      }
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No content items received from database');
        setConteudos([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Raw content items retrieved:', data.length);
      
      // Process content
      const sortedData = await processContentItems(data, localReadContentIds);
      
      console.log('Filtered and processed content for display:', sortedData.length);
      setConteudos(sortedData);
      setLastFetchTime(new Date());
      setIsLoading(false);
      
      // Notify for exact time content
      const exactTimeItems = sortedData.filter(item => item.isExactTime);
      if (exactTimeItems.length > 0 && isMobileDevice()) {
        playNotificationSound('alert');
        toast.info(`${exactTimeItems.length} conteúdos para o horário atual!`);
      }
    } catch (error) {
      console.error('Error loading produced content:', error);
      toast.error('Erro ao carregar conteúdos produzidos', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      setConteudos([]);
      setIsLoading(false);
    }
  }, [getCurrentProgram, fetchConteudos, processContentItems]);

  useEffect(() => {
    console.log('Initializing content hook');
    updateContent();
    
    // Check for program changes every minute
    const programChangeCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        console.log('Scheduled content refresh triggered');
        updateContent();
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(programChangeCheckInterval);
    };
  }, [updateContent]);

  return { 
    conteudos, 
    setConteudos, 
    isLoading, 
    lastFetchTime,
    refreshContent: updateContent
  };
}
