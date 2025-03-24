import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase, connectionStatus, isConnectionError } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, notifyUpcomingTestimonial, releaseScreenWakeLock, keepScreenAwake } from '@/services/notificationService';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ConnectionStatus from '@/components/ConnectionStatus';

// Imported Components
import PageHeader from '@/components/agenda/PageHeader';
import SearchBar from '@/components/agenda/SearchBar';
import TestimonialList from '@/components/agenda/TestimonialList';
import Footer from '@/components/agenda/Footer';

const Agenda: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [testemunhais, setTestemunhais] = useState([]);
  const [conteudos, setConteudos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const today = new Date();
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Retry mechanism for connection errors
  useEffect(() => {
    if (connectionError) {
      const retryTimeout = setTimeout(() => {
        console.log(`Tentativa automática de reconexão #${retryCount + 1}`);
        window.location.reload();
      }, 10000); // Tentar reconectar após 10 segundos
      
      return () => clearTimeout(retryTimeout);
    }
  }, [connectionError, retryCount]);

  useEffect(() => {
    // Verificar a conexão ao carregar a página
    supabase.checkConnection();
    
    // Adicionar listener para mudanças no status da conexão
    const handleConnectionChange = (event: CustomEvent) => {
      const { isOnline, error, retryCount } = event.detail;
      setIsOnline(isOnline);
      setConnectionError(!!error);
      setRetryCount(retryCount);
      
      if (isOnline && !error) {
        // Se a conexão foi restaurada, recarregar os dados
        fetchTestemunhais();
        fetchConteudosProduzidos();
      }
    };
    
    window.addEventListener('connectionStatusChanged', handleConnectionChange as EventListener);
    
    // Função para carregar testemunhais
    const fetchTestemunhais = async () => {
      try {
        setIsLoading(true);
        setConnectionError(false);
        
        // Get the current day of week in Portuguese
        const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
        console.log('Current day of week:', dayOfWeek);
        
        const { data, error } = await supabase
          .from('testemunhais')
          .select('id, patrocinador, texto, horario_agendado, status, programa_id, programas!inner(id, nome, dias, apresentador)')
          .order('horario_agendado', { ascending: true });
        
        if (error) {
          console.error('Error fetching testemunhais:', error);
          
          // Check if it's a network error
          if (error.message.includes('Failed to fetch')) {
            setConnectionError(true);
          }
          
          toast.error('Erro ao carregar testemunhais', {
            description: error.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          setTestemunhais([]);
        } else {
          console.log('Raw testemunhais data:', data);
          
          // Filter by today's day of week - improved filtering with better logging
          const filteredData = data && Array.isArray(data) ? data.filter(t => {
            if (!t || !t.programas) return false;
            
            const programDays = t.programas?.dias || [];
            console.log(`Testemunhal ${t.id} for program ${t.programas?.nome}:`, {
              programDays,
              currentDay: dayOfWeek,
              includes: programDays.includes(dayOfWeek)
            });
            
            return programDays.includes(dayOfWeek);
          }) : [];
          
          // Ensure all required fields are present
          const processedData = filteredData.map(item => {
            try {
              if (!item || !item.horario_agendado || typeof item.horario_agendado !== 'string') {
                console.warn('Item inválido ou sem horário agendado:', item);
                return null;
              }
              
              // Create a date object for today with the scheduled time
              const scheduledTimeParts = item.horario_agendado.split(':');
              if (scheduledTimeParts.length < 2) {
                console.warn('Formato de horário inválido:', item.horario_agendado);
                return null;
              }
              
              const scheduledHour = parseInt(scheduledTimeParts[0], 10);
              const scheduledMinute = parseInt(scheduledTimeParts[1], 10);
              
              if (isNaN(scheduledHour) || isNaN(scheduledMinute)) {
                console.warn('Horário não numérico:', scheduledHour, scheduledMinute);
                return null;
              }
              
              const scheduledDate = new Date();
              scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
              
              // Calculate minutes until scheduled time
              const now = new Date();
              const minutesUntil = differenceInMinutes(scheduledDate, now);
              
              // Add isUpcoming flag based on time proximity (10-30 minutes)
              const isUpcoming = minutesUntil >= 10 && minutesUntil <= 30;
              
              return {
                ...item,
                id: item.id || `temp-${Date.now()}-${Math.random()}`,
                texto: item.texto || "Sem texto disponível",
                isUpcoming,
                minutesUntil,
                tipo: 'testemunhal'
              };
            } catch (err) {
              console.error('Erro ao processar testemunhal:', err, item);
              return null;
            }
          }).filter(Boolean);
          
          console.log('Filtered testemunhais:', filteredData);
          
          // Sort to show upcoming testimonials first, then by scheduled time
          const sortedData = processedData.sort((a, b) => {
            // Verificar se os objetos são válidos
            if (!a || !b) return 0;
            
            // First by upcoming status (upcoming first)
            if (a.isUpcoming && !b.isUpcoming) return -1;
            if (!a.isUpcoming && b.isUpcoming) return 1;
            
            // Then by scheduled time
            if (a.horario_agendado && b.horario_agendado) {
              return a.horario_agendado.localeCompare(b.horario_agendado);
            }
            
            return 0;
          });
          
          setTestemunhais(sortedData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar testemunhais:', error);
        toast.error('Erro ao carregar testemunhais', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setTestemunhais([]);
        setIsLoading(false);
      }
    };
    
    // Função para carregar conteúdos produzidos
    const fetchConteudosProduzidos = async () => {
      try {
        // Verificar se a tabela existe
        const { error: checkError } = await supabase
          .from('conteudos_produzidos')
          .select('count')
          .limit(1);
          
        if (checkError && checkError.code === '42P01') {
          console.error('Tabela conteudos_produzidos não existe:', checkError);
          setConteudos([]);
          return;
        }
        
        // Obter a data atual formatada como string YYYY-MM-DD
        const dataAtual = format(today, 'yyyy-MM-dd');
        
        // Buscar conteúdos programados para a data atual
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .select('*, programas(id, nome, apresentador)')
          .eq('data_programada', dataAtual)
          .order('horario_programado', { ascending: true });
        
        if (error) {
          console.error('Erro ao carregar conteúdos produzidos:', error);
          
          // Verificar se é um erro de conexão
          if (error.message.includes('Failed to fetch')) {
            setConnectionError(true);
          }
          
          toast.error('Erro ao carregar conteúdos produzidos', {
            description: error.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          setConteudos([]);
          return;
        }
        
        console.log('Conteúdos produzidos para hoje:', data);
        
        // Processar os dados para o formato esperado pelo componente TestimonialList
        const processedData = data && Array.isArray(data) ? data.map(item => {
          try {
            // Verificar se o item tem as propriedades necessárias
            if (!item || !item.horario_programado || typeof item.horario_programado !== 'string') {
              console.warn('Item inválido ou sem horário programado:', item);
              return null;
            }
            
            // Criar um objeto de data para hoje com o horário programado
            const scheduledTimeParts = item.horario_programado.split(':');
            if (scheduledTimeParts.length < 2) {
              console.warn('Formato de horário inválido:', item.horario_programado);
              return null;
            }
            
            const scheduledHour = parseInt(scheduledTimeParts[0], 10);
            const scheduledMinute = parseInt(scheduledTimeParts[1], 10);
            
            if (isNaN(scheduledHour) || isNaN(scheduledMinute)) {
              console.warn('Horário não numérico:', scheduledHour, scheduledMinute);
              return null;
            }
            
            const scheduledDate = new Date();
            scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
            
            // Calcular minutos até o horário programado
            const now = new Date();
            const minutesUntil = differenceInMinutes(scheduledDate, now);
            
            // Adicionar flag isUpcoming com base na proximidade do horário (10-30 minutos)
            const isUpcoming = minutesUntil >= 10 && minutesUntil <= 30;
            
            return {
              ...item,
              id: item.id || `temp-${Date.now()}-${Math.random()}`,
              texto: item.conteudo || "Sem conteúdo disponível",
              patrocinador: item.nome || "Sem nome",
              horario_agendado: item.horario_programado,
              status: 'pendente',
              isUpcoming,
              minutesUntil,
              tipo: 'conteudo'
            };
          } catch (err) {
            console.error('Erro ao processar conteúdo:', err, item);
            return null;
          }
        }).filter(Boolean) : [];
        
        // Ordenar para mostrar conteúdos próximos primeiro, depois por horário programado
        const sortedData = processedData.sort((a, b) => {
          // Verificar se os objetos são válidos
          if (!a || !b) return 0;
          
          // Primeiro por status de proximidade (próximos primeiro)
          if (a.isUpcoming && !b.isUpcoming) return -1;
          if (!a.isUpcoming && b.isUpcoming) return 1;
          
          // Depois por horário programado
          if (a.horario_programado && b.horario_programado) {
            return a.horario_programado.localeCompare(b.horario_programado);
          }
          
          return 0;
        });
        
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
    
    fetchTestemunhais();
    fetchConteudosProduzidos();
    
    // Configurar intervalo para atualizar os dados a cada 5 minutos
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        fetchTestemunhais();
        fetchConteudosProduzidos();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('connectionStatusChanged', handleConnectionChange as EventListener);
    };
  }, []);

  // Function to mark a testemunhal as read
  const handleMarkAsRead = async (id: string, tipo: string = 'testemunhal') => {
    setIsMarkingAsRead(true);
    
    try {
      if (tipo === 'testemunhal') {
        const { data, error } = await supabase
          .from('testemunhais')
          .update({ 
            status: 'lido',
            timestamp_leitura: new Date().toISOString()
          })
          .eq('id', id)
          .select();
          
        if (error) throw error;
        
        // Remove the testimonial from the local list immediately
        setTestemunhais(prevTestemunhais => 
          prevTestemunhais.filter(t => t.id !== id)
        );
        
        toast.success('Testemunhal marcado como lido', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      } else if (tipo === 'conteudo') {
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .update({ 
            status: 'lido',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();
          
        if (error) throw error;
        
        // Remove the content from the local list immediately
        setConteudos(prevConteudos => 
          prevConteudos.filter(c => c.id !== id)
        );
        
        toast.success('Conteúdo marcado como lido', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
      toast.error('Erro ao marcar como lido', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  // Filter testimonials based on search text
  const filteredTestimonials = [...(testemunhais || []), ...(conteudos || [])].filter(item => {
    if (!item) return false;
    
    const searchLower = searchText.toLowerCase();
    return (
      (item.texto && typeof item.texto === 'string' && item.texto.toLowerCase().includes(searchLower)) ||
      (item.programas && item.programas.nome && typeof item.programas.nome === 'string' && item.programas.nome.toLowerCase().includes(searchLower)) ||
      (item.patrocinador && typeof item.patrocinador === 'string' && item.patrocinador.toLowerCase().includes(searchLower)) ||
      (item.nome && typeof item.nome === 'string' && item.nome.toLowerCase().includes(searchLower))
    );
  });

  if (connectionError) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Erro de conexão</AlertTitle>
          <AlertDescription className="mt-2">
            Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
          </AlertDescription>
          <div className="mt-4">
            <Button 
              variant="info"
              size="lg"
              rounded="lg"
              className="w-full shadow-lg"
              onClick={() => {
                setRetryCount(prev => prev + 1);
                window.location.reload();
              }}
            >
              <RefreshCw size={18} className="mr-2 animate-spin-slow" />
              Tentar novamente
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ConnectionStatus isOnline={isOnline} connectionError={connectionError} retryCount={retryCount} />
      <div className="container py-6">
        <PageHeader />
        <SearchBar 
          searchText={searchText} 
          setSearchText={setSearchText} 
        />
        <TestimonialList 
          testimonials={filteredTestimonials} 
          isLoading={isLoading} 
          onMarkAsRead={handleMarkAsRead}
          isPending={isMarkingAsRead}
        />
        <Footer />
      </div>
    </div>
  );
};

export default Agenda;
