'use client';

import React from 'react';
import styles from './Pagination.module.scss';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showPageInfo = true,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    // Always show: current page, ellipsis, last page
    // Only show ellipsis if current page is not the last page
    if (currentPage !== totalPages) {
      pages.push(currentPage);
      pages.push('ellipsis');
      pages.push(totalPages);
    } else {
      // If on last page, just show the last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={`${styles.pagination} ${className}`.trim()}>
      {showPageInfo && (
        <div className={styles.pageInfo}>
          Showing {startItem} to {endItem} of {totalItems} entries
        </div>
      )}
      <div className={styles.paginationControls}>
        <button
          className={`${styles.pageButton}${currentPage === 1 ? ` ${styles.disabled}` : ''}`}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 18l-6-6 6-6" />
            <path d="M18 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          className={`${styles.pageButton}${currentPage === 1 ? ` ${styles.disabled}` : ''}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={styles.pageNumbers}>
          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                  ...
                </span>
              );
            }
            return (
              <button
                key={page}
                className={`${styles.pageNumber}${currentPage === page ? ` ${styles.active}` : ''}`}
                onClick={() => handlePageChange(page as number)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          className={`${styles.pageButton}${currentPage === totalPages ? ` ${styles.disabled}` : ''}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <button
          className={`${styles.pageButton}${currentPage === totalPages ? ` ${styles.disabled}` : ''}`}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 18l6-6-6-6" />
            <path d="M6 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

