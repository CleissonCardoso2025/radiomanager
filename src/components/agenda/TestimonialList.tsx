
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TestimonialCard from './TestimonialCard';
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from "lucide-react";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Log information about the testimonials list for debugging
  console.log('Testimonials received in TestimonialList:', testimonials.length, testimonials);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // If not in fullscreen mode, request fullscreen
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      // If in fullscreen mode, exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Handle fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={fullscreenRef} 
      className={`container px-4 pb-8 flex-1 relative ${isFullscreen ? 'bg-white' : ''}`}
    >
      <div className="absolute top-2 right-2 z-10">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleFullscreen}
          className="rounded-full hover:bg-primary/10"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </Button>
      </div>

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
