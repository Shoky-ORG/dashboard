import React from 'react';
import { NormalizedPagination } from '@/types/api';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

export interface PaginationProps {
  pagination: NormalizedPagination;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { total, page, totalPages } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        Showing page <span className="pagination-highlight">{page}</span> of{' '}
        <span className="pagination-highlight">{totalPages}</span> ({total} items total)
      </div>
      <div className="pagination-actions">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon={<ChevronLeft size={16} />}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight size={16} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
