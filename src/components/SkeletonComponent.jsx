import React from 'react';

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/80 ${className}`} />;
}

export function TableSkeleton({ columns = 5, rows = 8, showActions = true }) {
  const cols = showActions ? columns + 1 : columns;
  return (
    <div className="admin-panel overflow-hidden">
      <div
        className="hidden border-b border-admin-border bg-admin-raised px-4 py-3 sm:grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {[...Array(cols)].map((_, i) => (
          <Bone key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-admin-border">
        {[...Array(rows)].map((_, r) => (
          <div
            key={r}
            className="grid items-center gap-4 px-4 py-3.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {[...Array(cols)].map((_, c) => (
              <Bone key={c} className={`h-4 ${c === 0 ? 'w-28' : 'w-16'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListPageSkeleton({ columns = 5, rows = 8 }) {
  return (
    <div className="space-y-3">
      <div className="admin-panel p-4">
        <Bone className="h-10 w-full max-w-xl rounded-lg" />
      </div>
      <TableSkeleton columns={columns} rows={rows} />
      <div className="admin-panel flex items-center justify-between p-3">
        <Bone className="h-4 w-32" />
        <div className="flex gap-2">
          <Bone className="h-9 w-9 rounded-lg" />
          <Bone className="h-9 w-9 rounded-lg" />
          <Bone className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ActivityTableSkeleton({ rows = 6 }) {
  return (
    <div>
      <div className="hidden border-b border-admin-border bg-admin-raised px-4 py-2 sm:grid sm:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_4.5rem] sm:gap-3">
        {['w-8', 'w-12', 'w-14', 'w-12', 'w-10', 'w-14', 'w-12'].map((width, index) => (
          <Bone key={index} className={`h-3 ${width}`} />
        ))}
      </div>
      <div className="divide-y divide-admin-border">
        {[...Array(rows)].map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-2 px-4 py-2.5 sm:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_4.5rem] sm:items-center sm:gap-3"
          >
            <Bone className="h-3 w-6" />
            <div>
              <Bone className="h-3.5 w-28" />
              <Bone className="mt-1.5 h-2.5 w-20" />
            </div>
            <div>
              <Bone className="h-3.5 w-16" />
              <Bone className="mt-1.5 h-2.5 w-12" />
            </div>
            <div>
              <Bone className="h-3 w-24" />
              <Bone className="mt-1.5 h-2.5 w-28" />
            </div>
            <div>
              <Bone className="h-3 w-24" />
              <Bone className="mt-1.5 h-2.5 w-28" />
            </div>
            <Bone className="h-3 w-28" />
            <Bone className="h-5 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityPaginationSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-t border-admin-border bg-admin-raised/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3">
        <Bone className="h-4 w-36" />
        <Bone className="h-9 w-24 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Bone className="h-9 w-9 rounded-lg" />
        <Bone className="h-9 w-9 rounded-lg" />
        <Bone className="h-9 w-9 rounded-lg" />
        <Bone className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="admin-panel flex items-center gap-2 px-3 py-2">
            <Bone className="h-7 w-7 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <Bone className="h-2.5 w-14" />
              <Bone className="mt-1.5 h-4 w-10" />
              <Bone className="mt-1 h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="admin-panel w-full overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-admin-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Bone className="h-4 w-28" />
            <Bone className="mt-2 h-3 w-16" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Bone className="h-10 w-full rounded-lg sm:w-72" />
            <div className="flex gap-1.5">
              <Bone className="h-7 w-10 rounded-md" />
              <Bone className="h-7 w-14 rounded-md" />
              <Bone className="h-7 w-14 rounded-md" />
            </div>
          </div>
        </div>
        <ActivityTableSkeleton rows={rows} />
        <ActivityPaginationSkeleton />
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="admin-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-lg" />
            <Bone className="h-4 w-40" />
          </div>
          <Bone className="h-9 w-24 rounded-lg" />
        </div>
        <div className="flex items-center gap-4 px-5 py-5">
          <Bone className="h-16 w-16 rounded-xl" />
          <div className="flex-1">
            <Bone className="h-6 w-48" />
            <Bone className="mt-2 h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="admin-panel space-y-3 p-4">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="admin-panel space-y-3 p-4">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
