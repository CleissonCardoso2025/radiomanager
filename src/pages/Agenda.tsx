
import React, { useState } from 'react';
import Header from '@/components/Header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Imported Components
import PageHeader from '@/components/agenda/PageHeader';
import SearchBar from '@/components/agenda/SearchBar';
import TestimonialList from '@/components/agenda/TestimonialList';
import Footer from '@/components/agenda/Footer';

const Agenda: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const today = new Date();
  const queryClient = useQueryClient();
  
  // Fetch testemunhais data from Supabase for today
  const { data: testemunhais = [], isLoading } = useQuery({
    queryKey: ['testemunhais-agenda', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testemunhais')
        .select('*, programas(nome, dias)')
        .order('horario_agendado', { ascending: true });
      
      if (error) {
        toast.error('Erro ao carregar testemunhais', {
          description: error.message,
        });
        return [];
      }
      
      // Filter by today's day of week
      const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
      
      return data.filter(t => {
        // Check if the testemunhal's program has today's day in its days array
        const programDays = t.programas?.dias || [];
        return programDays.some((day: string) => 
          day.toLowerCase() === dayOfWeek.toLowerCase()
        );
      });
    }
  });

  // Mutation to mark a testemunhal as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('testemunhais')
        .update({ 
          status: 'lido',
          timestamp_leitura: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testemunhais-agenda'] });
      toast.success('Testemunhal marcado como lido');
    },
    onError: (error) => {
      toast.error('Erro ao marcar testemunhal como lido', {
        description: error.message,
      });
    }
  });

  // Calculate notification count for the Header component
  const notificationCount = testemunhais.filter(t => 
    t.status === 'pendente' || t.status === 'atrasado'
  ).length;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

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
        isPending={markAsReadMutation.isPending}
      />
      <Footer />
    </div>
  );
};

export default Agenda;
