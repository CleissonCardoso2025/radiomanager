
import React from 'react';
import { format } from 'date-fns';
import UolNewsFeed from './UolNewsFeed';

const Footer: React.FC = () => {
  return (
    <div className="bg-white border-t mt-auto">
      <div className="container px-4 py-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground gap-4">
          <div className="flex items-center gap-4 min-w-[200px]">
            <span>Última atualização: {format(new Date(), 'HH:mm')}</span>
            <span className="text-muted-foreground/30">|</span>
            <span>2025 © Agencia Cleisson Cardoso</span>
          </div>
          <div className="flex-1 max-w-2xl">
            <UolNewsFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;

