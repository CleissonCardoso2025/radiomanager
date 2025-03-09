
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User } from 'lucide-react';

const PageHeader: React.FC = () => {
  const today = new Date();
  
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2">
              <User className="text-white h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Agenda Diária</h2>
              <p className="text-muted-foreground">
                {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
