import React from 'react';

const variants = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500/30',
  secondary:
    'bg-admin-raised text-admin-text hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-400/30',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/30',
  outline:
    'border border-admin-border bg-admin-surface text-admin-text-sub hover:bg-admin-raised focus:ring-teal-500/30',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant] || variants.primary
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
