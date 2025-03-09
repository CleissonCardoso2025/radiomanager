
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TestimonialCard from './TestimonialCard';

interface TestimonialListProps {
  testimonials: any[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  isPending: boolean;
}

const TestimonialList: React.FC<TestimonialListProps> = ({ 
  testimonials, 
  isLoading, 
  onMarkAsRead,
  isPending
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

  return (
    <div className="container px-4 pb-8 flex-1">
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {testimonials.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <p className="text-lg text-muted-foreground">Não há testemunhais pendentes para hoje</p>
                <p className="text-sm text-muted-foreground mt-2">Todos os testemunhais foram lidos ou não há agendamentos para hoje</p>
              </motion.div>
            ) : (
              testimonials.map((testemunhal) => (
                <AnimatePresence key={testemunhal.id} mode="wait">
                  <TestimonialCard 
                    key={testemunhal.id}
                    testemunhal={testemunhal}
                    onMarkAsRead={onMarkAsRead}
                    isPending={isPending}
                  />
                </AnimatePresence>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default TestimonialList;
