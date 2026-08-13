import { NormalizedPagination, PaginatedResponse } from '@/types/api';

/**
 * Safely extracts arrays from backend API responses.
 * Handles arrays [...], wrapped objects { chapters: [...] }, and indexed objects { "0": {...}, "1": {...} }.
 */
export function normalizeArrayResponse<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (typeof data === 'object') {
    if (Array.isArray(data.chapters)) return data.chapters;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.materials)) return data.materials;
    if (Array.isArray(data.assignments)) return data.assignments;
    if (Array.isArray(data.instructors)) return data.instructors;
    if (Array.isArray(data.users)) return data.users;
    if (Array.isArray(data.courses)) return data.courses;
    if (Array.isArray(data.data)) return normalizeArrayResponse<T>(data.data);

    // If data is an indexed object like { "0": {...}, "1": {...} }
    const values = Object.values(data);
    if (
      values.length > 0 &&
      values.every(
        (v) =>
          v &&
          typeof v === 'object' &&
          ('id' in (v as any) ||
            'chapter_number' in (v as any) ||
            'user_id' in (v as any) ||
            'code' in (v as any) ||
            'title' in (v as any) ||
            'title_ar' in (v as any))
      )
    ) {
      return values as T[];
    }
  }
  return [];
}

/**
 * Normalizes backend pagination responses into a unified structure.
 * Handles Format A (Users, Doctor Dashboard) and Format B (Courses, StudentProfiles, Enrollment).
 */
export function normalizePaginatedResponse<T>(data: any, meta?: any): PaginatedResponse<T> {
  const items: T[] = normalizeArrayResponse<T>(data);

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
