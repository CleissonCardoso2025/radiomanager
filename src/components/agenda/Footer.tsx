
import React from 'react';
import { format } from 'date-fns';
import UolNewsFeed from './UolNewsFeed';
import { Separator } from '@/components/ui/separator';

// Create a shared FooterContent component for reuse
const FooterContent: React.FC = () => {
  const now = new Date();
  
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground gap-4 w-full">
      <div className="flex items-center gap-2 shrink-0 overflow-hidden">
        <span className="whitespace-nowrap">{format(now, 'dd/MM/yyyy')} — {format(now, 'HH:mm:ss')}</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="hidden sm:inline whitespace-nowrap">2025 © Agencia Cleisson Cardoso</span>
      </div>
      <div className="flex-1 min-w-0">
        <UolNewsFeed />
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  // Update the time every second
  const [, forceUpdate] = React.useState({});
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate({});
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="bg-white border-t py-2 fixed bottom-0 left-0 right-0 z-10 w-full">
      <div className="container mx-auto px-4">
        <FooterContent />
      </div>
    </div>
  );
};

// Export the FooterContent component for reuse in fullscreen mode
export { FooterContent };
export default Footer;
