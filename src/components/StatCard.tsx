
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: 'blue' | 'green' | 'red';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  color = 'blue',
  className 
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <Card className={cn("stat-card group", className)}>
      <div className="text-center relative z-10 overflow-hidden">
        <h3 className="text-lg font-medium text-gray-600 mb-1 transition-transform group-hover:translate-y-[-2px]">
          {title}
        </h3>
        <p className={`text-3xl font-bold mt-2 transition-all duration-500 ${getColorClasses()}`}>
          {value}
        </p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
    </Card>
  );
};

export default StatCard;
