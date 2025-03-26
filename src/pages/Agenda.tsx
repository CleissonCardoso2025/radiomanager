import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { format, differenceInMinutes, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase, connectionStatus, isConnectionError, checkConnection } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, notifyUpcomingTestimonial, releaseScreenWakeLock, keepScreenAwake, playNotificationSound } from '@/services/notificationService';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ConnectionStatus from '@/components/ConnectionStatus';

// Imported Components
import PageHeader from '@/components/agenda/PageHeader';
import SearchBar from '@/components/agenda/SearchBar';
import TestimonialList from '@/components/agenda/TestimonialList';
import Footer from '@/components/agenda/Footer';

// Helper function to check if current date is within a date range
const isCurrentDateInRange = (currentDate: string, startDate: string | null, endDate: string | null): boolean => {
  if (!startDate && !endDate) return true;
  
  if (startDate && endDate) {
    return currentDate >= startDate && currentDate <= endDate;
  } else if (startDate) {
    return currentDate >= startDate;
  } else if (endDate) {
    return currentDate <= endDate;
  }
  
  return true;
};

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
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    if (connectionError) {
      const retryTimeout = setTimeout(() => {
        console.log(`Tentativa automática de reconexão #${retryCount + 1}`);
        window.location.reload();
      }, 10000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [connectionError, retryCount]);

  useEffect(() => {
    checkConnection();
    
    const handleConnectionChange = (event: CustomEvent) => {
      const { isOnline, error, retryCount } = event.detail;
      setIsOnline(isOnline);
      setConnectionError(!!error);
      setRetryCount(retryCount);
      
      if (isOnline && !error) {
        fetchTestemunhais();
        fetchConteudosProduzidos();
      }
    };
    
    window.addEventListener('connectionStatusChanged', handleConnectionChange as EventListener);
    
    const fetchTestemunhais = async () => {
      try {
        setIsLoading(true);
        setConnectionError(false);
        
        const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
        console.log('Current day of week:', dayOfWeek);
        
        const currentDate = format(today, 'yyyy-MM-dd');
        console.log('Current date:', currentDate);
        
        const { data, error } = await supabase
          .from('testemunhais')
          .select('id, patrocinador, texto, horario_agendado, status, programa_id, data_inicio, data_fim, programas!inner(id, nome, dias, apresentador), timestamp_leitura')
          .order('horario_agendado', { ascending: true });
        
        if (error) {
          console.error('Error fetching testemunhais:', error);
          
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
          
          const filteredData = data && Array.isArray(data) ? data.filter(t => {
            if (!t || !t.programas) return false;
            
            const programDays = t.programas?.dias || [];
            const isCorrectDay = programDays.includes(dayOfWeek);
            
            console.log(`Testemunhal ${t.id} for program ${t.programas?.nome}:`, {
              programDays,
              currentDay: dayOfWeek,
              includes: isCorrectDay
            });
            
            let isWithinDateRange = true;
            
            if (t.data_inicio && t.data_fim) {
              isWithinDateRange = isCurrentDateInRange(currentDate, t.data_inicio, t.data_fim);
              console.log(`Date range check for testemunhal ${t.id}:`, {
                data_inicio: t.data_inicio,
                data_fim: t.data_fim,
                currentDate,
                isWithinDateRange
              });
            } 
            else if (t.data_inicio) {
              isWithinDateRange = currentDate >= t.data_inicio;
              console.log(`Start date check for testemunhal ${t.id}:`, {
                data_inicio: t.data_inicio,
                currentDate,
                isWithinDateRange
              });
            } 
            else if (t.data_fim) {
              isWithinDateRange = currentDate <= t.data_fim;
              console.log(`End date check for testemunhal ${t.id}:`, {
                data_fim: t.data_fim,
                currentDate,
                isWithinDateRange
              });
            }
            
            let wasReadToday = false;
            if (t.status === 'lido' && t.timestamp_leitura) {
              const readDate = format(new Date(t.timestamp_leitura), 'yyyy-MM-dd');
              wasReadToday = readDate === currentDate;
            }
            
            return isCorrectDay && isWithinDateRange && !wasReadToday;
          }) : [];
          
          console.log('Filtered testemunhais by day, date range, and read status:', filteredData);
          
          const processedData = filteredData.map(item => {
            try {
              if (!item || !item.horario_agendado || typeof item.horario_agendado !== 'string') {
                console.warn('Item inválido ou sem horário agendado:', item);
                return null;
              }
              
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
              
              const now = new Date();
              const minutesUntil = differenceInMinutes(scheduledDate, now);
              
              const isUpcoming = minutesUntil >= 0 && minutesUntil <= 30;
              
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
          
          const sortedData = processedData.sort((a, b) => {
            if (!a || !b) return 0;
            
            if (a.isUpcoming && !b.isUpcoming) return -1;
            if (!a.isUpcoming && b.isUpcoming) return 1;
            
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
    
    const fetchConteudosProduzidos = async () => {
      try {
        const { error: checkError } = await supabase
          .from('conteudos_produzidos')
          .select('count')
          .limit(1);
          
        if (checkError && checkError.code === '42P01') {
          console.error('Tabela conteudos_produzidos não existe:', checkError);
          setConteudos([]);
          return;
        }
        
        const dataAtual = format(today, 'yyyy-MM-dd');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('Usuário não autenticado');
          return;
        }
        
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .select('*, programas(id, nome, apresentador)')
          .eq('data_programada', dataAtual)
          .order('horario_programado', { ascending: true });
        
        if (error) {
          console.error('Erro ao carregar conteúdos produzidos:', error);
          
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
        
        const filteredData = data && Array.isArray(data) ? data.filter(item => {
          if (item.status !== 'lido') return true;
          if (item.recorrente) return true;
          if (item.lido_por && Array.isArray(item.lido_por) && !item.lido_por.includes(user.id)) {
            return true;
          }
          return false;
        }) : [];
        
        const processedData = filteredData.map(item => {
          try {
            if (!item || !item.horario_programado || typeof item.horario_programado !== 'string') {
              console.warn('Item inválido ou sem horário programado:', item);
              return null;
            }
            
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
            
            const now = new Date();
            const minutesUntil = differenceInMinutes(scheduledDate, now);
            
            const isUpcoming = minutesUntil >= 0 && minutesUntil <= 30;
            
            if (isUpcoming && isMobileDevice()) {
              playNotificationSound('alert');
            }
            
            return {
              ...item,
              id: item.id || `temp-${Date.now()}-${Math.random()}`,
              texto: item.conteudo || "Sem conteúdo disponível",
              patrocinador: item.nome || "Sem nome",
              horario_agendado: item.horario_programado,
              status: item.status || 'pendente',
              isUpcoming,
              minutesUntil,
              tipo: 'conteudo',
              recorrente: item.recorrente || false
            };
          } catch (err) {
            console.error('Erro ao processar conteúdo:', err, item);
            return null;
          }
        }).filter(Boolean);
        
        const sortedData = processedData.sort((a, b) => {
          if (!a || !b) return 0;
          
          if (a.isUpcoming && !b.isUpcoming) return -1;
          if (!a.isUpcoming && b.isUpcoming) return 1;
          
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

  const handleMarkAsRead = async (id: string, tipo: string = 'testemunhal') => {
    setIsMarkingAsRead(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        setIsMarkingAsRead(false);
        return;
      }
      
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
        
        setTestemunhais(prevTestemunhais => 
          prevTestemunhais.filter(t => t.id !== id)
        );
        
        if (isMobileDevice()) {
          playNotificationSound('success');
        }
        
        toast.success('Testemunhal marcado como lido', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      } else if (tipo === 'conteudo') {
        const { data: conteudoData, error: conteudoError } = await supabase
          .from('conteudos_produzidos')
          .select('recorrente, lido_por')
          .eq('id', id)
          .single();
          
        if (conteudoError) throw conteudoError;
        
        let lido_por = [];
        
        if (conteudoData.lido_por && Array.isArray(conteudoData.lido_por)) {
          lido_por = [...conteudoData.lido_por];
          if (!lido_por.includes(user.id)) {
            lido_por.push(user.id);
          }
        } else {
          lido_por = [user.id];
        }
        
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .update({ 
            status: 'lido',
            lido_por: lido_por,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();
          
        if (error) throw error;
        
        if (!conteudoData.recorrente) {
          setConteudos(prevConteudos => 
            prevConteudos.filter(c => c.id !== id)
          );
        } else {
          setConteudos(prevConteudos => 
            prevConteudos.map(c => 
              c.id === id ? { ...c, status: 'lido' } : c
            )
          );
        }
        
        if (isMobileDevice()) {
          playNotificationSound('success');
        }
        
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
