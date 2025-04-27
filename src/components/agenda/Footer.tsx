
import React from 'react';
import { format } from 'date-fns';
import UolNewsFeed from './UolNewsFeed';
import { Separator } from '@/components/ui/separator';

const Footer: React.FC = () => {
  return (
    <div className="bg-white border-t mt-auto py-2">
      <div className="container px-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground gap-4 overflow-hidden">
          <div className="flex items-center gap-4 shrink-0">
            <span>Última atualização: {format(new Date(), 'HH:mm')}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>2025 © Agencia Cleisson Cardoso</span>
          </div>
          <div className="flex-1 max-w-2xl overflow-hidden">
            <UolNewsFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
