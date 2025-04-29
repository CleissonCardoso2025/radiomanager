
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationEllipsis 
} from "@/components/ui/pagination";

interface TestimonialPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TestimonialPagination: React.FC<TestimonialPaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
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

  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-6">
      <PaginationContent className="bg-white/50 backdrop-blur-sm shadow-sm rounded-lg p-1 border border-gray-100">
        <PaginationItem>
          <Button
            variant={currentPage === 1 ? "ghost" : "secondary"}
            size="sm"
            rounded="full"
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
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
                onClick={() => typeof page === 'number' && onPageChange(page)}
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
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 h-8 px-3"
          >
            <ChevronRight size={16} />
            <span className="sr-only">Próxima página</span>
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default TestimonialPagination;
