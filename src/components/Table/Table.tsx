'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styles from './Table.module.scss';
import Pagination from '@/components/Pagination';

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T = unknown> {
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

export default function Table<T extends Record<string, unknown>>({
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
              const rowKey = row && typeof row === 'object' && 'id' in row && row.id != null ? String(row.id) : String(rowIndex);
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
                        {column.render
                          ? (column.render(value, row) as React.ReactNode)
                          : (value as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={data.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          showPageInfo={showPageInfo}
        />
      )}
    </div>
  );
}

