'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styles from './Table.module.scss';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  showPageInfo?: boolean;
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  className = '',
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  pagination = false,
  itemsPerPage = 10,
  showPageInfo = true,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage, pagination]);

  const paginatedData = useMemo(() => {
    if (!pagination) return data;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage, pagination]);

  const startItem = useMemo(() => {
    if (!pagination || data.length === 0) return 0;
    return (currentPage - 1) * itemsPerPage + 1;
  }, [currentPage, itemsPerPage, pagination, data.length]);

  const endItem = useMemo(() => {
    if (!pagination) return data.length;
    return Math.min(currentPage * itemsPerPage, data.length);
  }, [currentPage, itemsPerPage, pagination, data.length]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    if (pagination && totalPages > 0) {
      if (currentPage > totalPages) {
        setCurrentPage(1);
      }
    } else if (pagination) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, pagination, totalPages]);

  if (data.length === 0) {
    return (
      <div className={`${styles.tableWrapper} ${className}`}>
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const tableClasses = [
    styles.table,
    striped && styles.striped,
    hoverable && styles.hoverable,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.tableWrapper} ${className}`.trim()}>
      <div className={styles.tableContainer}>
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={styles.headerCell}
                  style={{
                    textAlign: column.align || 'left',
                    width: column.width,
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => {
              const rowKey = row.id !== undefined ? row.id : rowIndex;
              return (
                <tr key={rowKey} className={styles.row}>
                  {columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td
                        key={column.key}
                        className={styles.cell}
                        style={{
                          textAlign: column.align || 'left',
                        }}
                      >
                        {column.render ? column.render(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className={styles.pagination}>
          {showPageInfo && (
            <div className={styles.pageInfo}>
              Showing {startItem} to {endItem} of {data.length} entries
            </div>
          )}
          <div className={styles.paginationControls}>
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
          </div>
        </div>
      )}
    </div>
  );
}

