
import React from 'react';
import { format } from 'date-fns';
import UolNewsFeed from './UolNewsFeed';
import { Separator } from '@/components/ui/separator';

const Footer: React.FC = () => {
  return (
    <div className="bg-white border-t mt-auto py-2 fixed bottom-0 left-0 right-0 z-10">
      <div className="container px-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span>{format(new Date(), 'dd/MM/yyyy')} — {format(new Date(), 'HH:mm:ss')}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="hidden sm:inline">2025 © Agencia Cleisson Cardoso</span>
          </div>
          <div className="flex-1 max-w-md overflow-hidden">
            <UolNewsFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
