import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import { releaseScreenWakeLock, keepScreenAwake } from '@/services/notificationService';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useContent } from '@/hooks/useContent';
import { useMarkAsRead } from '@/hooks/useMarkAsRead';
import ConnectionStatus from '@/components/ConnectionStatus';
import ConnectionErrorScreen from '@/components/agenda/ConnectionErrorScreen';
import { useAuth } from '@/App';

// Imported Components
import PageHeader from '@/components/agenda/PageHeader';
import TestimonialList from '@/components/agenda/TestimonialList';
import Footer from '@/components/agenda/Footer';

const Agenda: React.FC = () => {
  const { isOnline, connectionError, retryCount } = useConnectionStatus();
  const { testemunhais, isLoading, exactTimeTestimonials, setTestemunhais } = useTestimonials();
  const { conteudos, setConteudos } = useContent();
  const { markAsRead, isMarkingAsRead } = useMarkAsRead();
  // Busca removida conforme solicitado
  const filteredItems = [...testemunhais, ...conteudos];
  const { userRole } = useAuth();
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [attemptedFullscreen, setAttemptedFullscreen] = useState(false);
  
  // Não forçar mais tela cheia automaticamente para evitar erros
  // Em vez disso, mostrar um botão permanente para entrar em tela cheia
  const [showFullscreenButton, setShowFullscreenButton] = useState(true);
  
  const enterFullscreen = () => {
    if (fullscreenRef.current && !document.fullscreenElement) {
      fullscreenRef.current.requestFullscreen()
        .then(() => {
          console.log('Successfully entered fullscreen mode');
          setIsFullscreen(true);
          // Esconder o botão quando estiver em tela cheia
          setShowFullscreenButton(false);
        })
        .catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
          // Manter o botão visível se houver erro
          setShowFullscreenButton(true);
        });
    }
  };
  
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

  // Não forçar mais tela cheia automaticamente para evitar erros
  // Em vez disso, mostrar um botão permanente para entrar em tela cheia

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      
      // Quando sair da tela cheia, mostrar o botão novamente
      if (!isInFullscreen) {
        console.log('Exited fullscreen mode, showing button again');
        setShowFullscreenButton(true);
        // Reset attempted flag to allow trying again if user exits fullscreen
        setAttemptedFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleMarkAsRead = async (id: string, tipo: string = 'testemunhal') => {
    const result = await markAsRead(id, tipo);
    
    console.log('Mark as read result:', result, 'Type:', tipo, 'ID:', id);
    
    if (result === true) {
      // Remover o testemunhal da lista após marcado como lido (para este dia)
      if (tipo === 'testemunhal') {
        setTestemunhais(prev => prev.filter(t => t.id !== id));
      } else if (tipo === 'conteudo') {
        setConteudos(prev => prev.filter(c => c.id !== id));
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
    <div ref={fullscreenRef} className="min-h-screen bg-background">
      <Header />
      <ConnectionStatus isOnline={isOnline} connectionError={connectionError} retryCount={retryCount} />
      
      {/* Botão de tela cheia flutuante */}
      {showFullscreenButton && !isFullscreen && (
        <button 
          onClick={enterFullscreen}
          className="fixed bottom-4 right-4 z-50 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Entrar em tela cheia"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
          </svg>
        </button>
      )}
      
      <div className="container py-6">
        <PageHeader />
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
