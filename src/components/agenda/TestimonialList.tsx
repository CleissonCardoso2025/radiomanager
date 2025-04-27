import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TestimonialCard from './TestimonialCard';
import { Button } from "@/components/ui/button";
import { Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { FooterContent } from './Footer';

interface TestimonialListProps {
  testimonials: any[];
  isLoading: boolean;
  onMarkAsRead: (id: string, type: string) => void;
  isPending: boolean;
}

const TestimonialList: React.FC<TestimonialListProps> = ({ 
  testimonials, 
  isLoading, 
  onMarkAsRead,
  isPending
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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

  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const today = new Date().toISOString().slice(0, 10);
  const lidosHoje = JSON.parse(localStorage.getItem('testemunhais_lidos_' + today) || '[]');
  const currentTestimonials = testimonials.filter(t => !lidosHoje.includes(t.id)).slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (fullscreenRef.current) {
      fullscreenRef.current.scrollTop = 0;
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  console.log('Testimonials received in TestimonialList:', testimonials.length, testimonials);
  console.log('Current page:', currentPage, 'of', totalPages);
  console.log('Showing items', indexOfFirstItem + 1, 'to', Math.min(indexOfLastItem, testimonials.length));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (fullscreenRef.current && !document.fullscreenElement) {
        fullscreenRef.current.requestFullscreen()
          .then(() => {
            console.log('Entrou em tela cheia automaticamente');
            setIsFullscreen(true);
          })
          .catch(err => {
            console.error('Erro ao tentar entrar em tela cheia:', err);
          });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const renderTestimonials = () => {
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

    if (currentTestimonials.length === 0) {
      if (isFullscreen) {
        return (
          <div style={{ minHeight: '60vh' }} className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-white/90 rounded-xl p-8 shadow-sm border border-gray-100 max-w-md">
              <h3 className="text-2xl font-semibold mb-2">Não existem testemunhais programados para este horário.</h3>
            </div>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-gray-100 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Não há testemunhais ou conteúdos programados para hoje ou que correspondam à sua busca.
            </p>
            <div className="text-sm text-muted-foreground mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-medium text-yellow-700 mb-1">Diagnóstico:</p>
              <ul className="list-disc list-inside text-left text-yellow-700 space-y-1">
                <li>Verifique se existem programas cadastrados para hoje (terça-feira)</li>
                <li>Verifique se existem testemunhais ou conteúdos com data de início válida</li>
                <li>Verifique se os testemunhais não foram todos marcados como lidos</li>
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
          {currentTestimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testemunhal={testimonial}
              onMarkAsRead={id => {
                const today = new Date().toISOString().slice(0, 10);
                const lidosHoje = JSON.parse(localStorage.getItem('testemunhais_lidos_' + today) || '[]');
                if (!lidosHoje.includes(id)) {
                  localStorage.setItem('testemunhais_lidos_' + today, JSON.stringify([...lidosHoje, id]));
                }
                onMarkAsRead(id, 'testemunhal');
              }}
              isPending={isPending}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div 
      ref={fullscreenRef} 
      className={`container px-4 pb-8 flex-1 relative ${isFullscreen ? 'bg-white h-screen overflow-y-auto' : ''}`}
      style={{ fontSize: 24 }}
    >
      <div className="flex justify-end mb-4">
        <Button 
          variant="glass" 
          size="sm" 
          rounded="lg"
          onClick={toggleFullscreen}
          className="shadow-sm backdrop-blur-sm border border-gray-200/50"
        >
          {isFullscreen ? (
            <>
              <Minimize size={18} className="mr-2 text-primary" />
              <span className="text-sm font-medium">Sair da tela cheia</span>
            </>
          ) : (
            <>
              <Maximize size={18} className="mr-2 text-primary" />
              <span className="text-sm font-medium">Tela cheia</span>
            </>
          )}
        </Button>
      </div>

      {renderTestimonials()}

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent className="bg-white/50 backdrop-blur-sm shadow-sm rounded-lg p-1 border border-gray-100">
            <PaginationItem>
              <Button
                variant={currentPage === 1 ? "ghost" : "secondary"}
                size="sm"
                rounded="full"
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 h-8 px-3"
              >
                <ChevronLeft size={16} />
                <span className="sr-only">Página anterior</span>
              </Button>
            </PaginationItem>
            
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={`page-${index}`}>
                {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                  <PaginationEllipsis />
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    rounded="full"
                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                    className={`h-8 w-8 ${currentPage === page ? 'text-white' : 'text-gray-700'}`}
                  >
                    {page}
                  </Button>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <Button
                variant={currentPage === totalPages ? "ghost" : "secondary"}
                size="sm"
                rounded="full"
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 h-8 px-3"
              >
                <ChevronRight size={16} />
                <span className="sr-only">Próxima página</span>
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {isFullscreen && (
        <div className="bg-white border-t py-2 fixed bottom-0 left-0 right-0 z-10 w-full">
          <div className="container mx-auto px-4">
            <FooterContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialList;
