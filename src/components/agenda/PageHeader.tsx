
import React from 'react';
import { Button } from '@/components/ui/button';
import { Refresh } from 'lucide-react';
import SearchBar from './SearchBar';

interface PageHeaderProps {
  onRefresh: () => void;
  onSearch: (query: string) => void;
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  onRefresh,
  onSearch,
  title,
  subtitle
}) => {
  return (
    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center p-4 bg-white border-b">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center">
        <SearchBar searchQuery="" onSearchChange={onSearch} />
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="h-8 w-8"
          title="Atualizar"
        >
          <Refresh className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
