import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CornerDownLeft,
} from 'lucide-react';
import SelectField from './SelectField';

const DEFAULT_ROW_OPTIONS = [5, 10, 20, 50, 100];

/**
 * Compact table footer matching CLIENT TablePagination design (admin tokens).
 */
const TablePagination = ({
  showRange = true,
  showRows = true,
  rowOptions = DEFAULT_ROW_OPTIONS,
  defaultRows = 20,
  showJump = true,
  showFirstLast = true,
  page,
  limit,
  total = 0,
  totalPages = 1,
  isLastPage: isLastPageProp,
  onPageChange,
  onLimitChange,
  className = '',
}) => {
  const rowsFieldId = useId();
  const [jumpPageInput, setJumpPageInput] = useState('');

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || defaultRows);
  const safeTotal = Math.max(0, Number(total) || 0);
  const resolvedTotalPages = Math.max(1, Number(totalPages) || 1);

  const numericOptions = [
    ...new Set(
      rowOptions.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
    ),
  ].sort((a, b) => a - b);

  const effectiveRowOptions =
    numericOptions.length > 0
      ? numericOptions.includes(safeLimit)
        ? numericOptions
        : [...numericOptions, safeLimit].sort((a, b) => a - b)
      : DEFAULT_ROW_OPTIONS;

  const rowSelectOptions = useMemo(
    () => effectiveRowOptions.map((n) => ({ value: String(n), label: String(n) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRowOptions.join(',')]
  );

  const rangeStart = safeTotal === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const rangeEnd = Math.min(safePage * safeLimit, safeTotal);

  const atLastPage =
    isLastPageProp !== undefined && isLastPageProp !== null
      ? Boolean(isLastPageProp)
      : safePage >= resolvedTotalPages;

  useEffect(() => {
    setJumpPageInput('');
  }, [safePage, safeLimit]);

  const totalPagesForJump = resolvedTotalPages;

  const parsedJumpPage = (() => {
    const t = String(jumpPageInput).trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN;
    return n;
  })();

  const jumpPageInputInvalid =
    String(jumpPageInput).trim() !== '' &&
    (Number.isNaN(parsedJumpPage) ||
      parsedJumpPage < 1 ||
      parsedJumpPage > totalPagesForJump);

  const jumpPageCanSubmit =
    String(jumpPageInput).trim() !== '' &&
    !Number.isNaN(parsedJumpPage) &&
    parsedJumpPage >= 1 &&
    parsedJumpPage <= totalPagesForJump;

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    if (!jumpPageCanSubmit || !onPageChange) return;
    onPageChange(parsedJumpPage);
    setJumpPageInput('');
  };

  const handleFirst = () => {
    if (safePage > 1 && onPageChange) onPageChange(1);
  };

  const handlePrev = () => {
    if (safePage > 1 && onPageChange) onPageChange(safePage - 1);
  };

  const handleNext = () => {
    if (!atLastPage && onPageChange) onPageChange(safePage + 1);
  };

  const handleLast = () => {
    if (safePage < resolvedTotalPages && onPageChange) onPageChange(resolvedTotalPages);
  };

  const handleRowsChange = (opt) => {
    if (!onLimitChange) return;
    const raw = Number(opt?.value);
    const next = Math.min(100, Math.max(1, Number.isFinite(raw) ? raw : defaultRows));
    onLimitChange(next);
  };

  const navBtn = (disabled) =>
    `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
      disabled
        ? 'cursor-not-allowed text-admin-muted/40'
        : 'text-admin-text-sub hover:bg-admin-accent-soft hover:text-admin-accent-text'
    }`;

  const showControls = Boolean(onPageChange);
  const showJumpBlock = showJump && showControls;

  return (
    <div
      className={`border-t border-admin-border bg-admin-raised/60 px-4 py-3 sm:px-5 sm:py-3.5 ${className}`.trim()}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {(showRange || showRows) && (
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {showRange && (
              <div className="whitespace-nowrap text-sm text-admin-muted">
                Showing{' '}
                <span className="font-medium text-admin-text">{rangeStart}</span>
                {' to '}
                <span className="font-medium text-admin-text">{rangeEnd}</span>
                {' of '}
                <span className="font-medium text-admin-text">{safeTotal}</span>
              </div>
            )}
            {showRows && onLimitChange && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor={rowsFieldId}
                  className="text-xs font-medium text-admin-muted"
                >
                  Rows per page
                </label>
                <div className="w-[5.5rem]" id={rowsFieldId}>
                  <SelectField
                    options={rowSelectOptions}
                    value={
                      rowSelectOptions.find((o) => o.value === String(safeLimit)) ||
                      null
                    }
                    onChange={handleRowsChange}
                    isClearable={false}
                    isSearchable={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {showControls && (
          <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
            <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5">
              {showFirstLast && (
                <button
                  type="button"
                  onClick={handleFirst}
                  disabled={safePage === 1}
                  title="First page"
                  aria-label="First page"
                  className={navBtn(safePage === 1)}
                >
                  <ChevronsLeft className="h-4 w-4" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={handlePrev}
                disabled={safePage === 1}
                title="Previous page"
                aria-label="Previous page"
                className={navBtn(safePage === 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-admin-border bg-admin-surface px-2 text-sm font-semibold tabular-nums text-admin-text">
                {safePage}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={atLastPage}
                title="Next page"
                aria-label="Next page"
                className={navBtn(atLastPage)}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              {showFirstLast && (
                <button
                  type="button"
                  onClick={handleLast}
                  disabled={safePage >= resolvedTotalPages}
                  title="Last page"
                  aria-label="Last page"
                  className={navBtn(safePage >= resolvedTotalPages)}
                >
                  <ChevronsRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            {showJumpBlock && (
              <>
                <span
                  className="hidden h-6 w-px shrink-0 self-center bg-admin-border sm:block"
                  aria-hidden
                />
                <form
                  onSubmit={handleJumpSubmit}
                  className="flex min-w-0 shrink-0 items-center gap-2"
                >
                  <span className="hidden text-xs text-admin-muted lg:inline">Jump</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Page"
                    value={jumpPageInput}
                    onChange={(e) =>
                      setJumpPageInput(e.target.value.replace(/[^\d]/g, ''))
                    }
                    aria-invalid={jumpPageInputInvalid}
                    aria-label={`Go to page, 1–${totalPagesForJump}`}
                    className={`w-16 rounded-lg border px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 ${
                      jumpPageInputInvalid
                        ? 'border-rose-500 text-rose-700 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-admin-border bg-admin-surface text-admin-text focus:border-teal-500 focus:ring-teal-500/30'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!jumpPageCanSubmit}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
                    aria-label="Go to page"
                  >
                    <CornerDownLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs tabular-nums text-admin-muted">
                    / {totalPagesForJump}
                  </span>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TablePagination;
