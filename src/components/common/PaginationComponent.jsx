import { useState, useCallback } from 'react';
import TablePagination from './TablePagination';

/**
 * @deprecated Prefer importing TablePagination directly.
 * Kept so existing `usePagination` imports continue to work.
 */
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    total_pages: 1,
    is_last_page: true,
  });

  const updatePagination = useCallback((data) => {
    setPagination((prev) => {
      const page = data.page || prev.page;
      const limit = data.limit || prev.limit;
      const total = data.total ?? prev.total;
      const total_pages = data.total_pages || Math.ceil(total / limit) || 1;
      return {
        page,
        limit,
        total,
        total_pages,
        is_last_page: data.is_last_page ?? page >= total_pages,
      };
    });
  }, []);

  const goToPage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const changeLimit = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      total_pages: 1,
      is_last_page: true,
    });
  }, [initialPage, initialLimit]);

  return { pagination, updatePagination, goToPage, changeLimit, resetPagination };
};

/** Adapter for older Pagination prop names → TablePagination. */
export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  availableLimits,
  className,
  page,
  limit,
  total,
  totalPages,
  ...rest
}) {
  return (
    <div className={`admin-panel overflow-hidden mt-4 ${className || ''}`.trim()}>
      <TablePagination
        page={page ?? currentPage}
        limit={limit ?? itemsPerPage}
        total={total ?? totalItems}
        totalPages={totalPages}
        rowOptions={availableLimits}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        {...rest}
      />
    </div>
  );
}
