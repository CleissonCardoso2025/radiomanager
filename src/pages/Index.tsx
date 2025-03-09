import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import PerformanceChart from '@/components/PerformanceChart';
import NotificationsList from '@/components/NotificationsList';
import ProgramsTable from '@/components/ProgramsTable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [testemunhais, setTestemunhais] = useState([]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from('programas')
          .select('*');
        
        if (programsError) {
          toast.error('Erro ao carregar programas', {
            description: programsError.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
        } else {
          setPrograms(programsData.map(program => ({
            id: program.id,
            name: program.nome,
            time: `${program.horario_inicio?.slice(0, 5) || ''} - ${program.horario_fim?.slice(0, 5) || ''}`,
            presenter: program.apresentador,
            status: program.status,
          })));
        }

        // Fetch testimonials
        const { data: testimonialsData, error: testimonialsError } = await supabase
          .from('testemunhais')
          .select('*, programas(nome)')
          .order('horario_agendado', { ascending: true })
          .limit(3);
        
        if (testimonialsError) {
          toast.error('Erro ao carregar testemunhais', {
            description: testimonialsError.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
        } else {
          setTestemunhais(testimonialsData.map(item => ({
            id: item.id,
            title: item.patrocinador,
            program: item.programas?.nome || 'Programa não encontrado',
            time: item.horario_agendado?.slice(0, 5) || '',
            status: item.status,
          })));
        }

        setIsLoading(false);
        
        toast.success('Bem-vindo ao RadioManager', {
          description: 'Gerencie seus programas e testemunhais com facilidade.',
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get notification count based on testemunhais
  const notificationCount = testemunhais.filter(t => 
    t.status === 'pendente' || t.status === 'atrasado'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={notificationCount} />
      
      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-7xl">
        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard 
            title="Total de Programas" 
            value={programs.length.toString()} 
            color="blue"
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.1s_forwards]"
          />
          <StatCard 
            title="Testemunhais Ativos" 
            value={testemunhais.filter(t => t.status === 'pendente').length.toString()} 
            color="green"
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.2s_forwards]"
          />
          <StatCard 
            title="Leituras Pendentes" 
            value={testemunhais.filter(t => t.status === 'pendente').length.toString()} 
            color="red"
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.3s_forwards]"
          />
        </section>

        {/* Charts & Notifications */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PerformanceChart 
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.4s_forwards]"
          />
          <NotificationsList 
            notifications={testemunhais}
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.5s_forwards]"
          />
        </section>

        {/* Programs Table */}
        <section className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.6s_forwards]">
          <ProgramsTable programs={programs} />
        </section>
      </main>
    </div>
  );
};

export default Index;
