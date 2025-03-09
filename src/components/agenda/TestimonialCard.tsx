
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TestimonialCardProps {
  testemunhal: any;
  onMarkAsRead: (id: string) => void;
  isPending: boolean;
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'lido':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'atrasado':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return '';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'lido':
      return 'Lido';
    case 'atrasado':
      return 'Atrasado';
    case 'pendente':
      return 'Pendente';
    default:
      return '';
  }
};

export const getRandomGradient = () => {
  const gradients = [
    'bg-gradient-to-r from-pink-100 to-purple-100',
    'bg-gradient-to-r from-blue-100 to-teal-100',
    'bg-gradient-to-r from-yellow-100 to-orange-100',
    'bg-gradient-to-r from-green-100 to-teal-100',
    'bg-gradient-to-r from-indigo-100 to-purple-100',
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  testemunhal, 
  onMarkAsRead,
  isPending
}) => {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      exit={{
        opacity: 0,
        y: -20,
        transition: { duration: 0.3 }
      }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-all", 
        getRandomGradient()
      )}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={getStatusColor(testemunhal.status)}>
                  {getStatusText(testemunhal.status)}
                </Badge>
                <span className="text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {testemunhal.horario_agendado.slice(0, 5)}
                </span>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {testemunhal.programas?.nome || "Sem programa"}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">{testemunhal.patrocinador}</h3>
              <div className="text-muted-foreground mb-4 sm:mb-0">
                {testemunhal.texto}
              </div>
            </div>
            <div className="w-full sm:w-auto">
              {testemunhal.status !== 'lido' && (
                <Button
                  className="w-full sm:w-auto gap-2 animate-pulse hover:animate-none"
                  onClick={() => onMarkAsRead(testemunhal.id)}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4" />
                  {isPending ? 'Processando...' : 'Marcar como Lido'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestimonialCard;
