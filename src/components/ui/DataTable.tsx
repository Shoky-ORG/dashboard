import React from 'react';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import './DataTable.css';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="table-responsive">
      <table className="shoky-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{ width: col.width, textAlign: col.align || 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable-row' : ''}
            >
              {columns.map((col, idx) => {
                const content =
                  typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode);

                return (
                  <td key={idx} style={{ textAlign: col.align || 'left' }}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
