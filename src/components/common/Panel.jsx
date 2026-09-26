import React from 'react';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function Panel({ children, className = '', padding = true }) {
  return (
    <div
      className={joinClasses(
        'admin-panel',
        padding ? 'p-4 sm:p-5' : '',
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  to,
  className = '',
}) {
  const Wrapper = to ? 'a' : 'div';
  const linkProps = to
    ? { href: to, onClick: undefined }
    : {};

  // Prefer React Router Link when used from pages — this is a simple presentational card.
  // Pages can wrap with Link externally; keep as div/button-friendly block.
  void Wrapper;
  void linkProps;

  return (
    <div
      className={joinClasses(
        'admin-panel p-4 transition-colors hover:border-teal-300/60 dark:hover:border-teal-800',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-admin-text">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-admin-muted">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-admin-accent-soft text-admin-accent-text">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral',
  className = '',
}) {
  const tones = {
    neutral:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    warning:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    danger:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    accent:
      'bg-admin-accent-soft text-admin-accent-text',
  };

  return (
    <span
      className={joinClasses(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        tones[tone] || tones.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={joinClasses(
        'admin-panel flex flex-col items-center justify-center px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-admin-raised text-admin-muted">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-admin-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-admin-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default Panel;
