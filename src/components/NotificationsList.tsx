
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  program: string;
  time: string;
  status: string;
}

interface NotificationsListProps {
  notifications: NotificationItem[];
  className?: string;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications, 
  className 
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Notificações Recentes</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          Ver Todas
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-300 animate-fade-in"
            >
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-gray-500">
                  {item.program} - {item.time}
                </p>
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "ml-2 transition-colors",
                  item.status === 'pendente' || item.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                    : 'bg-green-100 text-green-800 border-green-200'
                )}
              >
                {item.status === 'pendente' || item.status === 'pending' ? 'Pendente' : 'Concluído'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsList;
