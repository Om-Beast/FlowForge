import { PaginatedResult } from '../shared/interfaces';

export interface PaginationParams {
  page: number;
  limit: number;
}

export const parsePaginationParams = (
  page?: string | number,
  limit?: string | number,
  maxLimit = 100,
): PaginationParams => {
  const parsedPage = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
  const parsedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(limit ?? 20), 10) || 20),
  );
  return { page: parsedPage, limit: parsedLimit };
};

export const calculateSkip = (page: number, limit: number): number =>
  (page - 1) * limit;

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};
