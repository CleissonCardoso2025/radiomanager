
import React, { useState } from 'react';
import TestimonialItems from './TestimonialItems';
import TestimonialPagination from './TestimonialPagination';
import FullscreenHandler from './FullscreenHandler';
import { ContentItem } from '@/hooks/content/types';

interface TestimonialListProps {
  testimonials: ContentItem[];
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTestimonials = testimonials.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Reset scroll position when changing pages
    window.scrollTo(0, 0);
  };

  console.log('Testimonials received in TestimonialList:', testimonials.length, testimonials);
  console.log('Current page:', currentPage, 'of', totalPages);
  console.log('Showing items', indexOfFirstItem + 1, 'to', Math.min(indexOfLastItem, testimonials.length));

  return (
    <FullscreenHandler>
      <TestimonialItems 
        testimonials={currentTestimonials} 
        onMarkAsRead={onMarkAsRead} 
        isPending={isPending}
        isLoading={isLoading}
      />

      <TestimonialPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </FullscreenHandler>
  );
};

export default TestimonialList;
