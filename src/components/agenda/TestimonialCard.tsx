
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, Clock, Type, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
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
    'bg-white',
    'bg-white',
    'bg-white',
    'bg-white',
    'bg-white',
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  testemunhal, 
  onMarkAsRead,
  isPending
}) => {
  const [fontSize, setFontSize] = useState(16); // Tamanho padrão da fonte

  const increaseFontSize = () => {
    if (fontSize < 24) {
      setFontSize(prevSize => prevSize + 2);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      setFontSize(prevSize => prevSize - 2);
    }
  };

  // Determine if this is an upcoming testimonial
  const isUpcoming = testemunhal.isUpcoming;

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
        getRandomGradient(),
        isUpcoming && "border-2 border-amber-500 bg-amber-50"
      )}>
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getStatusColor(testemunhal.status)}>
                {getStatusText(testemunhal.status)}
              </Badge>
              <span className={cn(
                "text-muted-foreground flex items-center",
                isUpcoming && "text-amber-700 font-medium"
              )}>
                <Clock className={cn("mr-1 h-4 w-4", isUpcoming && "text-amber-500")} />
                {testemunhal.horario_agendado.slice(0, 5)}
                {isUpcoming && (
                  <span className="ml-2 flex items-center text-amber-700">
                    <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
                    Em breve
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={decreaseFontSize}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Type className="h-4 w-4 text-muted-foreground" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={increaseFontSize}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col mb-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 self-start mb-1">
              {testemunhal.programas?.nome || "Sem programa"}
            </Badge>
            {testemunhal.programas?.apresentador && (
              <span className="text-sm text-muted-foreground">
                Apresentador(es): {testemunhal.programas.apresentador}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold">{testemunhal.patrocinador}</h3>
          {isUpcoming && testemunhal.minutesUntil > 0 && (
            <p className="text-sm text-amber-700 font-medium mt-1">
              Faltam aproximadamente {testemunhal.minutesUntil} minutos para a leitura
            </p>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2 relative">
          <div 
            className="text-muted-foreground mb-12 sm:mb-12"
            style={{ fontSize: `${fontSize}px` }}
          >
            {testemunhal.texto}
          </div>
          
          {testemunhal.status !== 'lido' && (
            <div className="absolute bottom-4 right-4">
              <Button
                className={cn(
                  "gap-2",
                  isUpcoming && "bg-amber-500 hover:bg-amber-600"
                )}
                onClick={() => onMarkAsRead(testemunhal.id)}
                disabled={isPending}
              >
                <Check className="h-4 w-4" />
                {isPending ? 'Processando...' : 'Marcar como Lido'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestimonialCard;
