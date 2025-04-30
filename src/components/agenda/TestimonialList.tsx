
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
  onRefresh?: () => void;
}

const TestimonialList: React.FC<TestimonialListProps> = ({ 
  testimonials, 
  isLoading, 
  onMarkAsRead,
  isPending,
  onRefresh
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const totalPages = Math.ceil((testimonials?.length || 0) / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTestimonials = testimonials?.slice(indexOfFirstItem, indexOfLastItem) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Reset scroll position when changing pages
    window.scrollTo(0, 0);
  };

  console.log('TestimonialList - isLoading:', isLoading);
  console.log('TestimonialList - Testimonials count:', testimonials?.length || 0);
  console.log('TestimonialList - Current page:', currentPage, 'of', totalPages);
  console.log('TestimonialList - Showing items', indexOfFirstItem + 1, 'to', Math.min(indexOfLastItem, testimonials?.length || 0));

  return (
    <FullscreenHandler withAutoFullscreen={false}>
      <TestimonialItems 
        testimonials={currentTestimonials} 
        onMarkAsRead={onMarkAsRead} 
        isPending={isPending}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />

      {totalPages > 1 && (
        <TestimonialPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </FullscreenHandler>
  );
};

export default TestimonialList;
