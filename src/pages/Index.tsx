
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import PerformanceChart from '@/components/PerformanceChart';
import NotificationsList from '@/components/NotificationsList';
import ProgramsTable from '@/components/ProgramsTable';
import { toast } from 'sonner';

const Index = () => {
  const [notificationCount, setNotificationCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  // Simulating data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      toast.success('Bem-vindo ao RadioManager', {
        description: 'Gerencie seus programas e testemunhais com facilidade.',
        position: 'top-right',
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Notification data
  const notifications = [
    {
      id: '1',
      title: 'Testemunhal Pendente',
      program: 'Manhã Total',
      time: '10:30',
      status: 'pending' as const,
    },
    {
      id: '2',
      title: 'Leitura Confirmada',
      program: 'Tarde Show',
      time: '14:15',
      status: 'success' as const,
    },
    {
      id: '3',
      title: 'Nova Solicitação',
      program: 'Noite dos Amigos',
      time: '19:45',
      status: 'pending' as const,
    },
  ];

  // Programs data
  const programs = [
    {
      id: '1',
      name: 'Manhã Total',
      time: '06:00 - 10:00',
      presenter: 'Carlos Silva',
      status: 'Ativo',
    },
    {
      id: '2',
      name: 'Tarde Show',
      time: '14:00 - 17:00',
      presenter: 'Ana Oliveira',
      status: 'Ativo',
    },
    {
      id: '3',
      name: 'Noite dos Amigos',
      time: '19:00 - 22:00',
      presenter: 'Roberto Almeida',
      status: 'Ativo',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={notificationCount} />
      
      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-7xl">
        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard 
            title="Total de Programas" 
            value="12" 
            color="blue"
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.1s_forwards]"
          />
          <StatCard 
            title="Testemunhais Ativos" 
            value="45" 
            color="green"
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.2s_forwards]"
          />
          <StatCard 
            title="Leituras Pendentes" 
            value="8" 
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
            notifications={notifications}
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
