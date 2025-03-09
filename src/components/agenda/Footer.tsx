
import React from 'react';
import { format } from 'date-fns';

const Footer: React.FC = () => {
  return (
    <div className="bg-white border-t mt-auto">
      <div className="container px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <div>
            Última atualização: {format(new Date(), 'HH:mm')}
          </div>
          <div>
            Suporte técnico: (11) 4002-8922
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
