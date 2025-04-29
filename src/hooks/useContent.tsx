
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';
import { useContentFetcher } from './content/useContentFetcher';
import { useContentProcessor } from './content/useContentProcessor';
import { useProgramScheduler } from './content/useProgramScheduler';

export function useContent() {
  const [conteudos, setConteudos] = useState([]);
  const [lastProgramChange, setLastProgramChange] = useState<string | null>(null);
  const today = new Date();
  
  const { fetchConteudos } = useContentFetcher();
  const { processContentItems } = useContentProcessor();
  const { getCurrentProgram } = useProgramScheduler();

  useEffect(() => {
    const updateContent = async () => {
      try {
        const dataAtual = format(new Date(), 'yyyy-MM-dd');
        console.log('Data atual para conteúdos:', dataAtual);
        
        // Get current program
        const { currentProgram, currentProgramId } = await getCurrentProgram();
        
        // Sempre atualizar os conteúdos, independentemente de mudanças de programa
        console.log('Atualizando conteúdos...');
        setLastProgramChange(currentProgramId);
        
        // Fetch content
        const { data, error, localReadContentIds } = await fetchConteudos(dataAtual);
        
        if (error) {
          console.error('Erro ao carregar conteúdos produzidos:', error);
          toast.error('Erro ao carregar conteúdos produzidos', {
            description: error.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          setConteudos([]);
          return;
        }
        
        if (!data || !Array.isArray(data)) {
          console.error('Dados inválidos ou vazios retornados da consulta');
          setConteudos([]);
          return;
        }
        
        // Process content
        const sortedData = await processContentItems(data, localReadContentIds);
        
        console.log('Conteúdos filtrados e processados para exibição:', sortedData.length);
        setConteudos(sortedData);
      } catch (error) {
        console.error('Erro ao carregar conteúdos produzidos:', error);
        toast.error('Erro ao carregar conteúdos produzidos', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setConteudos([]);
      }
    };

    updateContent();
    
    // Check for program changes every minute
    const programChangeCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        updateContent();
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(programChangeCheckInterval);
    };
  }, []);

  return { conteudos, setConteudos };
}
