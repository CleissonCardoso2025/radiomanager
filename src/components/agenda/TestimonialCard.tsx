import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, Clock, Type, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TestimonialCardProps {
  testemunhal: any;
  onMarkAsRead: (id: string, tipo?: string) => void;
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
  const [expanded, setExpanded] = useState(false);

  // Determine if this is an upcoming testimonial
  const isUpcoming = testemunhal.isUpcoming;
  const isExactTime = testemunhal.isExactTime;
  const isConteudo = testemunhal.tipo === 'conteudo';
  const minutesUntil = testemunhal.minutesUntil;

  const handleMarkAsRead = () => {
    onMarkAsRead(testemunhal.id, testemunhal.tipo);
  };

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
      className={cn(
        isUpcoming && "",
        isExactTime && ""
      )}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-all", 
        getRandomGradient(),
        isUpcoming && "border-2 border-amber-500 bg-amber-50",
        isExactTime && "border-2 border-red-500 bg-red-50 shadow-lg",
        isConteudo && "border-l-4 border-l-blue-500",
        testemunhal.recorrente && "border-2 border-blue-500 bg-blue-50"
      )}>
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(
                getStatusColor(testemunhal.status),
                isConteudo && "bg-blue-100 text-blue-800 border-blue-200",
                isUpcoming && !isExactTime && "bg-amber-100 text-amber-800 border-amber-200",
                isExactTime && "bg-red-100 text-red-800 border-red-200 animate-pulse"
              )}>
                {isExactTime ? 'AGORA!' : (isUpcoming ? 'Em breve' : (isConteudo ? 'Conteúdo' : getStatusText(testemunhal.status)))}
              </Badge>
              
              {testemunhal.recorrente && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 ml-2">
                  Recorrente
                </Badge>
              )}
              <span className="text-muted-foreground flex items-center">
                <Clock className={cn(
                  "h-3.5 w-3.5 mr-1",
                  isUpcoming && !isExactTime && "text-amber-600",
                  isExactTime && "text-red-600"
                )} />
                {testemunhal.horario_agendado}
                {isUpcoming && minutesUntil !== undefined && minutesUntil > 0 && (
                  <span className="ml-1 text-amber-700 font-medium">(em {minutesUntil} min)</span>
                )}
                {isExactTime && (
                  <span className="ml-1 text-red-700 font-bold animate-pulse"> (HORÁRIO EXATO!)</span>
                )}
                {testemunhal.recorrente && (
                  <span className="ml-2 text-blue-600 font-medium">
                    {testemunhal.recorrenteInfo || 
                      (testemunhal.data_fim ? 
                        `Recorrente até ${new Date(testemunhal.data_fim).toLocaleDateString('pt-BR')}` : 
                        'Conteúdo recorrente')}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          <div className="mt-1 mb-2">
            <h3 className="text-sm font-medium text-foreground">
              {isConteudo ? testemunhal.nome : testemunhal.patrocinador}
            </h3>
            <p className="text-xs text-muted-foreground">
              {testemunhal.programas?.nome || 'Programa não especificado'}
              {testemunhal.programas?.apresentador && ` • ${testemunhal.programas.apresentador}`}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="prose prose-sm max-w-none">

            <p style={{ fontSize: '24px' }} className={cn(
              "whitespace-pre-wrap break-words",
              isExactTime && "font-semibold bg-red-50 p-2 rounded-md border border-red-200"
            )}>
              {testemunhal.texto}
            </p>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleMarkAsRead}
              disabled={isPending}
              variant="success"
              size="sm"
              className={cn(
                "shadow-sm",
                isExactTime && "bg-red-600 hover:bg-red-700"
              )}
              isLoading={isPending}
            >
              {!isPending && <Check className="h-4 w-4 mr-1" />}
              <span>{isPending ? 'Processando...' : 'Marcar como lido'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestimonialCard;
