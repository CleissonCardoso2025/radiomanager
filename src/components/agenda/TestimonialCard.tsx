
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
  const [fontSize, setFontSize] = useState(16); // Tamanho padrão da fonte
  const [expanded, setExpanded] = useState(false);

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
      className={isUpcoming ? "animate-pulse-slow" : ""}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-all", 
        getRandomGradient(),
        isUpcoming && "border-2 border-amber-500 bg-amber-50",
        isConteudo && "border-l-4 border-l-blue-500"
      )}>
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(
                getStatusColor(testemunhal.status),
                isConteudo && "bg-blue-100 text-blue-800 border-blue-200",
                isUpcoming && "bg-amber-100 text-amber-800 border-amber-200"
              )}>
                {isUpcoming ? 'Em breve' : (isConteudo ? 'Conteúdo' : getStatusText(testemunhal.status))}
              </Badge>
              <span className="text-muted-foreground flex items-center">
                <Clock className={`h-3.5 w-3.5 mr-1 ${isUpcoming ? 'text-amber-600' : ''}`} />
                {testemunhal.horario_agendado}
                {isUpcoming && minutesUntil !== undefined && (
                  <span className="ml-1 text-amber-700 font-medium">(em {minutesUntil} min)</span>
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
            <div className="flex items-center justify-end mb-2 space-x-2">
              <div className="bg-gradient-to-r from-gray-100/80 to-gray-50/80 backdrop-blur-sm rounded-lg flex items-center p-1 shadow-sm border border-gray-200/50">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={decreaseFontSize} 
                  className="h-8 w-8 text-gray-600 hover:bg-gray-200/70"
                  title="Diminuir texto"
                >
                  <Type className="h-3.5 w-3.5" />
                  <ChevronDown className="h-2.5 w-2.5" />
                </Button>
                <span className="text-xs font-medium text-gray-600 px-2">{fontSize}px</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={increaseFontSize} 
                  className="h-8 w-8 text-gray-600 hover:bg-gray-200/70"
                  title="Aumentar texto"
                >
                  <Type className="h-3.5 w-3.5" />
                  <ChevronUp className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            <p style={{ fontSize: `${fontSize}px` }} className="whitespace-pre-wrap break-words">
              {testemunhal.texto}
            </p>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleMarkAsRead}
              disabled={isPending}
              variant="success"
              size="sm"
              className="shadow-sm"
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
