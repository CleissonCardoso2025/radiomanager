
import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import { releaseScreenWakeLock, keepScreenAwake } from '@/services/notificationService';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useContent } from '@/hooks/useContent';
import { useMarkAsRead } from '@/hooks/useMarkAsRead';
import { useFilteredItems } from '@/hooks/useFilteredItems';
import ConnectionStatus from '@/components/ConnectionStatus';
import ConnectionErrorScreen from '@/components/agenda/ConnectionErrorScreen';
import { useAuth } from '@/App';

// Imported Components
import PageHeader from '@/components/agenda/PageHeader';
import SearchBar from '@/components/agenda/SearchBar';
import TestimonialList from '@/components/agenda/TestimonialList';
import Footer from '@/components/agenda/Footer';

const Agenda: React.FC = () => {
  const { isOnline, connectionError, retryCount } = useConnectionStatus();
  const { testemunhais, isLoading, exactTimeTestimonials, setTestemunhais } = useTestimonials();
  const { conteudos, setConteudos } = useContent();
  const { markAsRead, isMarkingAsRead } = useMarkAsRead();
  const { filteredItems, searchText, setSearchText } = useFilteredItems(testemunhais, conteudos);
  const { userRole } = useAuth();
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Effect to automatically enter fullscreen for non-admin users
  useEffect(() => {
    // Only enter fullscreen automatically for non-admin users
    if (userRole === 'locutor' && fullscreenRef.current && !isFullscreen) {
      // Use a small timeout to ensure the component is fully mounted
      const timer = setTimeout(() => {
        if (fullscreenRef.current?.requestFullscreen && !document.fullscreenElement) {
          fullscreenRef.current.requestFullscreen().then(() => {
            setIsFullscreen(true);
          }).catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [userRole, isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleMarkAsRead = async (id: string, tipo: string = 'testemunhal') => {
    const result = await markAsRead(id, tipo);
    
    if (result === true) {
      // Remover da lista apenas quando não for recorrente
      if (tipo === 'testemunhal') {
        setTestemunhais(prev => prev.filter(t => t.id !== id));
      } else {
        setConteudos(prev => prev.filter(c => c.id !== id));
      }
    }
    // Se for recorrente (result === 'recorrente'), não remover da lista
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
    <div ref={fullscreenRef} className="min-h-screen bg-background">
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

export default Agenda;
