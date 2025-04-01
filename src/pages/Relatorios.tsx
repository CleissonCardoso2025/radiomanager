
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { releaseScreenWakeLock, keepScreenAwake } from '@/services/notificationService';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useContent } from '@/hooks/useContent';
import { useMarkAsRead } from '@/hooks/useMarkAsRead';
import { useFilteredItems } from '@/hooks/useFilteredItems';
import ConnectionStatus from '@/components/ConnectionStatus';
import ConnectionErrorScreen from '@/components/agenda/ConnectionErrorScreen';

// Imported Components
import PageHeader from '@/components/agenda/PageHeader';
import SearchBar from '@/components/agenda/SearchBar';
import TestimonialList from '@/components/agenda/TestimonialList';
import Footer from '@/components/agenda/Footer';

const Relatorios: React.FC = () => {
  const { isOnline, connectionError, retryCount } = useConnectionStatus();
  const { testemunhais, isLoading, exactTimeTestimonials, setTestemunhais } = useTestimonials();
  const { conteudos, setConteudos } = useContent();
  const { markAsRead, isMarkingAsRead } = useMarkAsRead();
  const { filteredItems, searchText, setSearchText } = useFilteredItems(testemunhais, conteudos);

  // Effect to manage screen wake lock
  useEffect(() => {
    // Try to keep screen awake if there are active testimonials
    if (testemunhais.length > 0 || conteudos.length > 0) {
      keepScreenAwake();
    }
    
    // Clean up wake lock on unmount
    return () => {
      releaseScreenWakeLock();
    };
  }, [testemunhais.length, conteudos.length]);

  const handleMarkAsRead = async (id: string, tipo: string = 'testemunhal') => {
    const result = await markAsRead(id, tipo);
    
    console.log('Mark as read result:', result, 'Type:', tipo, 'ID:', id);
    
    if (result === true) {
      // Item should be removed if not recurrent
      if (tipo === 'testemunhal') {
        setTestemunhais(prev => prev.filter(t => t.id !== id));
      } else if (tipo === 'conteudo') {
        setConteudos(prev => prev.filter(c => c.id !== id));
      }
    } else if (result === 'recorrente') {
      console.log('Item is recurrent, updating state to reflect read status');
      // For recurrent items, we should update their status to reflect they've been read
      // by the current user without removing them from the list
      if (tipo === 'testemunhal') {
        setTestemunhais(prev => 
          prev.map(t => t.id === id ? { ...t, status: 'lido' } : t)
        );
      } else if (tipo === 'conteudo') {
        setConteudos(prev => 
          prev.map(c => c.id === id ? { ...c, status: 'lido' } : c)
        );
      }
    }
  };

  if (connectionError) {
    return (
      <ConnectionErrorScreen 
        retryCount={retryCount} 
        onRetry={() => window.location.reload()} 
      />
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
          testimonials={filteredItems} 
          isLoading={isLoading} 
          onMarkAsRead={handleMarkAsRead}
          isPending={isMarkingAsRead}
        />
        <Footer />
      </div>
    </div>
  );
};

export default Relatorios;
