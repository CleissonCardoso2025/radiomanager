
import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Store the beforeinstallprompt event for later use
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

interface InstallPromptProps {
  className?: string;
}

const PROMPT_STORAGE_KEY = 'pwa-install-prompt-shown';

const InstallPrompt: React.FC<InstallPromptProps> = ({ className }) => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if already prompted in this session
    const hasBeenPrompted = sessionStorage.getItem(PROMPT_STORAGE_KEY);
    if (hasBeenPrompted) return;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser prompt
      e.preventDefault();
      
      // Store the event for later use
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt
      setIsOpen(true);
      
      // Mark as prompted in this session
      sessionStorage.setItem(PROMPT_STORAGE_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    
    try {
      // Show the native install prompt
      const { outcome } = await installPromptEvent.prompt();
      
      // Handle the user choice
      if (outcome === 'accepted') {
        console.log('App was installed');
      } else {
        console.log('App install was dismissed');
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      // Clear the stored event
      setInstallPromptEvent(null);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  // Don't render anything if there's no install prompt event or dialog is closed
  if (!installPromptEvent || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Instalar RadioManager</DialogTitle>
          <DialogDescription>
            Instale o RadioManager no seu dispositivo para acesso rápido e uma melhor experiência.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <img 
            src="/lovable-uploads/3e40860d-a8dd-4cc1-84be-a58ec6e0d4b7.png" 
            alt="Radio Manager Logo" 
            className="w-24 h-24 rounded-xl"
          />
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss} className="sm:flex-1">
            Agora não
          </Button>
          <Button 
            onClick={handleInstall} 
            className="sm:flex-1 bg-primary text-white flex items-center gap-2"
          >
            <Download size={18} />
            Instalar App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstallPrompt;
