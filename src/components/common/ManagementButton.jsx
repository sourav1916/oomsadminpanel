import React from 'react';
import { Loader2 } from 'lucide-react';

const toneClasses = {
  slate: {
    solid:
      'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white',
    soft: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    outline:
      'bg-admin-surface text-admin-text-sub border-admin-border hover:bg-admin-raised',
  },
  teal: {
    solid: 'bg-teal-600 text-white hover:bg-teal-700',
    soft: 'bg-admin-accent-soft text-admin-accent-text hover:bg-teal-100 dark:hover:bg-teal-950/40',
    outline:
      'bg-admin-surface text-teal-700 border-teal-200 hover:bg-admin-accent-soft dark:text-teal-300 dark:border-teal-900',
  },
  blue: {
    solid: 'bg-teal-600 text-white hover:bg-teal-700',
    soft: 'bg-admin-accent-soft text-admin-accent-text hover:bg-teal-100',
    outline:
      'bg-admin-surface text-teal-700 border-teal-200 hover:bg-admin-accent-soft',
  },
  green: {
    solid: 'bg-emerald-600 text-white hover:bg-emerald-700',
    soft: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    outline: 'bg-admin-surface text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  emerald: {
    solid: 'bg-emerald-600 text-white hover:bg-emerald-700',
    soft: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    outline: 'bg-admin-surface text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  indigo: {
    solid: 'bg-teal-600 text-white hover:bg-teal-700',
    soft: 'bg-admin-accent-soft text-admin-accent-text hover:bg-teal-100',
    outline:
      'bg-admin-surface text-teal-700 border-teal-200 hover:bg-admin-accent-soft',
  },
  violet: {
    solid: 'bg-teal-600 text-white hover:bg-teal-700',
    soft: 'bg-admin-accent-soft text-admin-accent-text hover:bg-teal-100',
    outline:
      'bg-admin-surface text-teal-700 border-teal-200 hover:bg-admin-accent-soft',
  },
  amber: {
    solid: 'bg-amber-600 text-white hover:bg-amber-700',
    soft: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    outline: 'bg-admin-surface text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  rose: {
    solid: 'bg-rose-600 text-white hover:bg-rose-700',
    soft: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    outline: 'bg-admin-surface text-rose-700 border-rose-200 hover:bg-rose-50',
  },
};

const sizeClasses = {
  sm: 'px-3 py-2 text-xs rounded-lg gap-1.5',
  md: 'px-3.5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-4 py-3 text-sm rounded-lg gap-2',
};

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function ManagementButton({
  children,
  tone = 'teal',
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const palette = toneClasses[tone] || toneClasses.teal;
  const toneClass = palette[variant] || palette.solid;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={joinClasses(
        'inline-flex items-center justify-center border border-transparent font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/30',
        toneClass,
        sizeClass,
        fullWidth ? 'w-full' : 'w-auto',
        isDisabled ? 'cursor-not-allowed opacity-60' : '',
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : leftIcon}
      <span className="whitespace-nowrap">{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
