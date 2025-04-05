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
  const [attemptedFullscreen, setAttemptedFullscreen] = useState(false);

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
    // Only enter fullscreen automatically for non-admin users and if we haven't tried yet
    if (userRole === 'locutor' && fullscreenRef.current && !isFullscreen && !attemptedFullscreen) {
      // Set flag to prevent multiple attempts
      setAttemptedFullscreen(true);
      
      console.log('Attempting to enter fullscreen for locutor user');
      
      // Try to request fullscreen with a delay to ensure component is mounted
      const timer = setTimeout(() => {
        if (fullscreenRef.current?.requestFullscreen && !document.fullscreenElement) {
          fullscreenRef.current.requestFullscreen()
            .then(() => {
              console.log('Successfully entered fullscreen mode');
              setIsFullscreen(true);
            })
            .catch(err => {
              console.error(`Error attempting to enable fullscreen: ${err.message}`);
              // Try again with a user interaction
              const tryAgainButton = document.createElement('button');
              tryAgainButton.innerText = 'Clique para entrar em tela cheia';
              tryAgainButton.style.position = 'fixed';
              tryAgainButton.style.top = '50%';
              tryAgainButton.style.left = '50%';
              tryAgainButton.style.transform = 'translate(-50%, -50%)';
              tryAgainButton.style.padding = '10px 20px';
              tryAgainButton.style.backgroundColor = '#4CAF50';
              tryAgainButton.style.color = 'white';
              tryAgainButton.style.border = 'none';
              tryAgainButton.style.borderRadius = '5px';
              tryAgainButton.style.cursor = 'pointer';
              tryAgainButton.style.zIndex = '9999';
              
              tryAgainButton.onclick = () => {
                if (fullscreenRef.current?.requestFullscreen) {
                  fullscreenRef.current.requestFullscreen()
                    .then(() => {
                      setIsFullscreen(true);
                      document.body.removeChild(tryAgainButton);
                    })
                    .catch(e => console.error('Second attempt failed:', e));
                }
              };
              
              document.body.appendChild(tryAgainButton);
              
              // Auto-remove after 10 seconds if not clicked
              setTimeout(() => {
                if (document.body.contains(tryAgainButton)) {
                  document.body.removeChild(tryAgainButton);
                }
              }, 10000);
            });
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userRole, isFullscreen, attemptedFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        console.log('Exited fullscreen mode, may attempt to re-enter');
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
      // Item should be removed
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
