
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TestimonialCard from './TestimonialCard';
import { ContentItem } from '@/hooks/content/types';
import { AlertCircle } from 'lucide-react';

interface TestimonialItemsProps {
  testimonials: ContentItem[];
  onMarkAsRead: (id: string, type: string) => void;
  isPending: boolean;
  isLoading: boolean;
}

const TestimonialItems: React.FC<TestimonialItemsProps> = ({
  testimonials,
  onMarkAsRead,
  isPending,
  isLoading
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  console.log('TestimonialItems - isLoading:', isLoading, 'Items count:', testimonials?.length || 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando testemunhais...</p>
        </div>
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-gray-100 max-w-md">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Não há testemunhais ou conteúdos programados para hoje ou que correspondam à sua busca.
          </p>
          <div className="text-sm text-muted-foreground mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-700 mb-1">Diagnóstico:</p>
            <ul className="list-disc list-inside text-left text-yellow-700 space-y-1">
              <li>Verifique se existem programas cadastrados para hoje</li>
              <li>Verifique se existem testemunhais ou conteúdos com data de início válida</li>
              <li>Verifique se há conteúdos recorrentes configurados (com data de início e fim)</li>
              <li>Verifique se os testemunhais e conteúdos não foram todos marcados como lidos</li>
              <li>Conteúdos não recorrentes só aparecem uma vez, mesmo que não marcados como lidos</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4"
    >
      <AnimatePresence>
        {testimonials.map((testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            testemunhal={testimonial}
            onMarkAsRead={id => {
              onMarkAsRead(id, testimonial.tipo || 'testemunhal');
            }}
            isPending={isPending}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default TestimonialItems;
