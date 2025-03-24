
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

  // Calculate pagination values
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTestimonials = testimonials.slice(indexOfFirstItem, indexOfLastItem);
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of list when changing pages
    if (fullscreenRef.current) {
      fullscreenRef.current.scrollTop = 0;
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Add ellipsis before middle pages if needed
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after middle pages if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Log information about the testimonials list for debugging
  console.log('Testimonials received in TestimonialList:', testimonials.length, testimonials);
  console.log('Current page:', currentPage, 'of', totalPages);
  console.log('Showing items', indexOfFirstItem + 1, 'to', Math.min(indexOfLastItem, testimonials.length));

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
      className={`container px-4 pb-8 flex-1 relative ${isFullscreen ? 'bg-white h-screen overflow-y-auto' : ''}`}
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
              <>
                {currentTestimonials.map((testemunhal) => (
                  <AnimatePresence key={testemunhal.id} mode="wait">
                    <TestimonialCard 
                      key={testemunhal.id}
                      testemunhal={testemunhal}
                      onMarkAsRead={onMarkAsRead}
                      isPending={isPending}
                    />
                  </AnimatePresence>
                ))}
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      {/* Previous page button */}
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          aria-disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={`page-${index}`}>
                          {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink 
                              isActive={currentPage === page} 
                              onClick={() => typeof page === 'number' && handlePageChange(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      
                      {/* Next page button */}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          aria-disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default TestimonialList;
