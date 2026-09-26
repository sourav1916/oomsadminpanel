import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function resolveRowKey(row, rowKey, index) {
  if (typeof rowKey === 'function') return rowKey(row, index);
  if (row && rowKey in row) return row[rowKey];
  return index;
}

export default function ManagementTable({
  rows = [],
  columns = [],
  rowKey = 'id',
  actions,
  getActions,
  onRowClick,
  emptyState,
  className = '',
  tableClassName = '',
  containerClassName = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName = '',
  cellClassName = '',
  accent = 'slate',
  compact = false,
  showHeader = true,
  showActionsColumn = true,
  showSerial = false,
  serialStart = 1,
  footer = null,
  actionsHeader = <MoreVertical className="ml-auto h-3.5 w-3.5 text-admin-muted" />,
  actionsClassName = '',
}) {
  void accent;
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1024);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const allVisibleColumns = columns.filter((column) => column.visible !== false);

  const getResponsiveColumns = () => {
    let maxCols = allVisibleColumns.length;
    if (containerWidth < 340) maxCols = 1;
    else if (containerWidth < 480) maxCols = 2;
    else if (containerWidth < 640) maxCols = 3;
    else if (containerWidth < 768) maxCols = 4;
    else if (containerWidth < 1024) maxCols = 5;
    else if (containerWidth < 1280) maxCols = 6;
    return allVisibleColumns.slice(0, maxCols);
  };

  const visibleColumns = getResponsiveColumns();
  const densityClasses = compact ? 'px-3 py-2.5' : 'px-4 py-3';

  if (!rows.length) {
    return emptyState || null;
  }

  return (
    <div
      ref={containerRef}
      className={joinClasses(
        'admin-panel w-full overflow-hidden',
        containerClassName,
        className
      )}
    >
      <div className={joinClasses('w-full overflow-x-auto', tableClassName)}>
        <table className="w-full text-left text-sm text-admin-text-sub">
          {showHeader && (
            <thead
              className={joinClasses(
                'sticky top-0 z-[1] hidden border-b border-admin-border bg-admin-raised text-[11px] font-semibold uppercase tracking-[0.08em] text-admin-muted sm:table-header-group',
                headerClassName
              )}
            >
              <tr>
                {showSerial && (
                  <th className={joinClasses(densityClasses, 'w-14 font-semibold text-left')}>
                    S.No
                  </th>
                )}
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className={joinClasses(
                      densityClasses,
                      'font-semibold text-left',
                      column.headerClassName
                    )}
                  >
                    {column.label}
                  </th>
                ))}
                {showActionsColumn && (actions || getActions) && (
                  <th
                    className={joinClasses(
                      densityClasses,
                      'w-12 pr-4 text-right',
                      actionsClassName
                    )}
                  >
                    {actionsHeader}
                  </th>
                )}
              </tr>
            </thead>
          )}

          <tbody
            className={joinClasses(
              'divide-y divide-admin-border',
              bodyClassName
            )}
          >
            {rows.map((row, index) => {
              const key = resolveRowKey(row, rowKey, index);
              const rowActions =
                typeof getActions === 'function' ? getActions(row, index) : actions;
              const hasRowActions = Array.isArray(rowActions)
                ? rowActions.length > 0
                : Boolean(rowActions);

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                  className={joinClasses(
                    'align-middle text-left transition-colors',
                    index % 2 === 1 ? 'bg-admin-raised/40' : 'bg-admin-surface',
                    onRowClick && 'cursor-pointer hover:bg-admin-accent-soft/50',
                    !onRowClick && 'hover:bg-admin-raised/70',
                    rowClassName
                  )}
                >
                  {showSerial && (
                    <td className={joinClasses(densityClasses, 'w-14 tabular-nums text-admin-muted')}>
                      {Number(serialStart) + index}
                    </td>
                  )}
                  {visibleColumns.map((column) => {
                    const content =
                      typeof column.render === 'function'
                        ? column.render(row, index)
                        : row?.[column.key];

                    return (
                      <td
                        key={column.key}
                        className={joinClasses(
                          densityClasses,
                          'max-w-[150px] truncate sm:max-w-[200px] lg:max-w-[250px]',
                          column.className,
                          cellClassName
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}

                  {showActionsColumn && (actions || getActions) && (
                    <td
                      className="w-12 pr-4 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {hasRowActions && (
                        <ActionMenu actions={rowActions} />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
