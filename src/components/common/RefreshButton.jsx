import React from 'react';
import { RefreshCw } from 'lucide-react';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function RefreshButton({
  children = 'Refresh',
  loading = false,
  onClick,
  className = '',
  title = 'Refresh',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      title={title}
      className={joinClasses(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2 text-sm font-semibold text-admin-text-sub transition-colors hover:bg-admin-raised hover:text-admin-text disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...rest}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
