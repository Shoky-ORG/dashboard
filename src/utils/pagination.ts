import { NormalizedPagination, PaginatedResponse } from '@/types/api';

/**
 * Normalizes backend pagination responses into a unified structure.
 * Handles Format A (Users, Doctor Dashboard) and Format B (Courses, StudentProfiles, Enrollment).
 */
export function normalizePaginatedResponse<T>(data: any, meta?: any): PaginatedResponse<T> {
  const items: T[] = Array.isArray(data) ? data : data?.items || data?.users || data?.courses || [];
  
  const rawMeta = meta || (data && !Array.isArray(data) ? data : {});

  // Format A: total, page, limit, total_pages
  // Format B: totalItems, itemCount, itemsPerPage, totalPages, currentPage
  const total = rawMeta.total ?? rawMeta.totalItems ?? rawMeta.count ?? items.length;
  const page = rawMeta.page ?? rawMeta.currentPage ?? 1;
  const limit = rawMeta.limit ?? rawMeta.itemsPerPage ?? 10;
  const totalPages = rawMeta.total_pages ?? rawMeta.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1);

  const pagination: NormalizedPagination = {
    total: Number(total) || 0,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    totalPages: Number(totalPages) || 1,
  };

  return {
    items,
    pagination,
  };
}
