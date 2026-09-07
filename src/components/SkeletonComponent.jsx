import React from 'react';

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

export function TableSkeleton({ columns = 5, rows = 8, showActions = true }) {
  const cols = showActions ? columns + 1 : columns;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-3 sm:grid dark:border-slate-800 dark:bg-slate-800/60" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {[...Array(cols)].map((_, i) => (
          <Bone key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {[...Array(rows)].map((_, r) => (
          <div key={r} className="grid items-center gap-4 px-4 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
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
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Bone className="h-10 w-full max-w-xl rounded-xl" />
      </div>
      <TableSkeleton columns={columns} rows={rows} />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
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

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Bone className="h-3 w-16" />
            <Bone className="mt-3 h-7 w-20" />
            <Bone className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Bone className="mb-3 h-4 w-28" />
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="mb-2 h-12 w-full rounded-md" />
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <Bone className="mb-3 h-4 w-28" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Bone key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <TableSkeleton columns={3} rows={6} showActions={false} />
        <TableSkeleton columns={3} rows={6} showActions={false} />
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-lg" />
            <Bone className="h-4 w-40" />
          </div>
          <Bone className="h-9 w-24 rounded-xl" />
        </div>
        <div className="flex items-center gap-4 px-5 py-5">
          <Bone className="h-16 w-16 rounded-xl" />
          <div className="flex-1">
            <Bone className="h-6 w-48" />
            <Bone className="mt-2 h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Bone className="mb-3 h-4 w-28" />
            <Bone className="mb-2 h-3 w-full" />
            <Bone className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminSkeleton() {
  return <ListPageSkeleton />;
}
