import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { format } from 'date-fns';
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
        const { data, error } = await supabase
          .from('testemunhais')
          .select('*, programas(nome, dias)')
          .order('horario_agendado', { ascending: true });
        
        if (error) {
          toast.error('Erro ao carregar testemunhais', {
            description: error.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          setTestemunhais([]);
        } else {
          // Filter by today's day of week
          const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
          
          const filteredData = data.filter(t => {
            // Check if the testemunhal's program has today's day in its days array
            const programDays = t.programas?.dias || [];
            return programDays.some((day: string) => 
              day.toLowerCase() === dayOfWeek.toLowerCase()
            );
          });
          
          setTestemunhais(filteredData);
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
      
      // Update local state
      setTestemunhais(prevTestemunhais => 
        prevTestemunhais.map(t => 
          t.id === id ? { ...t, status: 'lido' } : t
        )
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header notificationCount={notificationCount} />
      <PageHeader />
      <SearchBar searchText={searchText} setSearchText={setSearchText} />
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
