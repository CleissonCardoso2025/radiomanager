
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Imported Components
import PageHeader from '@/components/agenda/PageHeader';
import SearchBar from '@/components/agenda/SearchBar';
import TestimonialList from '@/components/agenda/TestimonialList';
import Footer from '@/components/agenda/Footer';

const Agenda: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [testemunhais, setTestemunhais] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const today = new Date();
  
  // Fetch testemunhais data from Supabase for today
  useEffect(() => {
    const fetchTestemunhais = async () => {
      try {
        // Get the current day of week in Portuguese
        const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
        console.log('Current day of week:', dayOfWeek);
        
        const { data, error } = await supabase
          .from('testemunhais')
          .select('id, patrocinador, texto, horario_agendado, status, programa_id, programas!inner(id, nome, dias, apresentador)')
          .order('horario_agendado', { ascending: true });
        
        if (error) {
          console.error('Error fetching testemunhais:', error);
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
          const filteredData = data.filter(t => {
            const programDays = t.programas?.dias || [];
            console.log(`Testemunhal ${t.id} for program ${t.programas?.nome}:`, {
              programDays,
              currentDay: dayOfWeek
            });
            
            // Case-insensitive comparison and normalize day names
            return programDays.some((day: string) => {
              const normalizedDay = day.toLowerCase().trim();
              const normalizedCurrentDay = dayOfWeek.toLowerCase().trim();
              console.log(`Comparing: ${normalizedDay} with ${normalizedCurrentDay}`);
              return normalizedDay === normalizedCurrentDay;
            });
          });
          
          console.log('Filtered testemunhais:', filteredData);
          
          // Ensure all required fields are present
          const processedData = filteredData.map(item => {
            // Create a date object for today with the scheduled time
            const scheduledTimeParts = item.horario_agendado.split(':');
            const scheduledHour = parseInt(scheduledTimeParts[0], 10);
            const scheduledMinute = parseInt(scheduledTimeParts[1], 10);
            
            const scheduledDate = new Date();
            scheduledDate.setHours(scheduledHour, scheduledMinute, 0);
            
            // Calculate minutes until scheduled time
            const now = new Date();
            const minutesUntil = differenceInMinutes(scheduledDate, now);
            
            // Add isUpcoming flag based on time proximity (10-30 minutes)
            const isUpcoming = minutesUntil >= 10 && minutesUntil <= 30;
            
            return {
              ...item,
              texto: item.texto || "Sem texto disponível",
              isUpcoming,
              minutesUntil
            };
          });
          
          // Sort to show upcoming testimonials first, then by scheduled time
          const sortedData = processedData.sort((a, b) => {
            // First by upcoming status (upcoming first)
            if (a.isUpcoming && !b.isUpcoming) return -1;
            if (!a.isUpcoming && b.isUpcoming) return 1;
            
            // Then by scheduled time
            return a.horario_agendado.localeCompare(b.horario_agendado);
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
    
    fetchTestemunhais();
    
    // Set up an interval to refresh the data and recalculate the upcoming status
    const intervalId = setInterval(() => {
      fetchTestemunhais();
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [today]);

  // Function to mark a testemunhal as read
  const handleMarkAsRead = async (id: string) => {
    setIsMarkingAsRead(true);
    
    try {
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
    } catch (error: any) {
      toast.error('Erro ao marcar testemunhal como lido', {
        description: error.message,
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  // Calculate notification count for the Header component
  const notificationCount = testemunhais.filter(t => 
    t.status === 'pendente' || t.status === 'atrasado'
  ).length;

  // Filter out already read testimonials and apply search filter
  const filteredTestemunhais = testemunhais
    .filter(t => t.status !== 'lido') // Remove read items from display
    .filter(t => 
      t.patrocinador.toLowerCase().includes(searchText.toLowerCase())
    );

  // Count upcoming testimonials
  const upcomingCount = filteredTestemunhais.filter(t => t.isUpcoming).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header notificationCount={notificationCount} />
      <PageHeader />
      <SearchBar searchText={searchText} setSearchText={setSearchText} />
      
      {upcomingCount > 0 && (
        <div className="container px-4 mt-2 mb-0">
          <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-md border border-amber-200">
            <p className="text-sm font-medium">
              {upcomingCount} testemunhal{upcomingCount > 1 ? 'is' : ''} com leitura programada nos próximos 10-30 minutos
            </p>
          </div>
        </div>
      )}
      
      <TestimonialList 
        testimonials={filteredTestemunhais} 
        isLoading={isLoading} 
        onMarkAsRead={handleMarkAsRead}
        isPending={isMarkingAsRead}
      />
      <Footer />
    </div>
  );
};

export default Agenda;
