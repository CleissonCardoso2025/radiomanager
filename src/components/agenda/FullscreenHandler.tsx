
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from "lucide-react";
import { FooterContent } from './Footer';

interface FullscreenHandlerProps {
  children: React.ReactNode;
  withAutoFullscreen?: boolean;
}

const FullscreenHandler: React.FC<FullscreenHandlerProps> = ({ 
  children,
  withAutoFullscreen = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Removido o efeito que tentava entrar em tela cheia automaticamente
  // Agora o usuário precisa clicar no botão para entrar em tela cheia
  // Isso evita erros no console relacionados a restrições de segurança do navegador

  return (
    <div 
      ref={fullscreenRef} 
      className={`container px-4 pb-8 flex-1 relative ${isFullscreen ? 'bg-white h-screen overflow-y-auto' : ''}`}
      style={{ fontSize: 24 }}
    >
      <div className="flex justify-end mb-4">
        <Button 
          variant="glass" 
          size="sm" 
          rounded="lg"
          onClick={toggleFullscreen}
          className="shadow-sm backdrop-blur-sm border border-gray-200/50"
        >
          {isFullscreen ? (
            <>
              <Minimize size={18} className="mr-2 text-primary" />
              <span className="text-sm font-medium">Sair da tela cheia</span>
            </>
          ) : (
            <>
              <Maximize size={18} className="mr-2 text-primary" />
              <span className="text-sm font-medium">Tela cheia</span>
            </>
          )}
        </Button>
      </div>
      
      {children}
      
      {isFullscreen && (
        <div className="bg-white border-t py-2 fixed bottom-0 left-0 right-0 z-10 w-full">
          <div className="container mx-auto px-4">
            <FooterContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenHandler;
