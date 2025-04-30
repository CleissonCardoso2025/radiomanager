
import React from 'react';
import SearchBar from './SearchBar';
import { RefreshCcw, CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ onSearch, onRefresh }) => {
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  }).format(currentDate);
  
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda do Locutor</h1>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>{capitalizeFirstLetter(formattedDate)}</span>
          </div>
        </div>
        
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            className="ml-auto"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        )}
      </div>
      
      {onSearch && <SearchBar onSearch={onSearch} />}
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>Exibindo itens para este programa e horário</span>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
