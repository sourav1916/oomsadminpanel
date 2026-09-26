import React from 'react';
import RefreshButton from './RefreshButton';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function ManagementHub({
  eyebrow,
  title,
  description,
  accent = 'slate',
  summary,
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
  refreshing = false,
  refreshLabel = 'Refresh',
  refreshTitle,
  actions,
  children,
  className = '',
  contentClassName = '',
  widthClassName = 'max-w-[1600px]',
}) {
  void accent;

  return (
    <div className={joinClasses('min-h-0', className)}>
      <div className={joinClasses('mx-auto', widthClassName)}>
        <header className="mb-5 flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-3xl">
            {eyebrow && (
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-admin-accent-text">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="text-xl font-bold tracking-tight text-admin-text md:text-2xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-admin-text-sub">{description}</p>
            )}
          </div>

          {(summary || actions || onRefresh) && (
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              {summary}
              <div className="flex flex-wrap items-center justify-end gap-2">
                {onRefresh && (
                  <RefreshButton
                    type="button"
                    loading={refreshing}
                    onClick={onRefresh}
                    title={refreshTitle || refreshLabel}
                  >
                    {refreshLabel}
                  </RefreshButton>
                )}
                {actions}
              </div>
            </div>
          )}
        </header>

        {tabs?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1 border-b border-admin-border pb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              const disabled = tab.disabled || false;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => !disabled && onTabChange && onTabChange(tab.id)}
                  disabled={disabled}
                  title={tab.title || tab.description || tab.label}
                  className={joinClasses(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-admin-accent-soft text-admin-accent-text'
                      : disabled
                        ? 'cursor-not-allowed text-admin-muted opacity-50'
                        : 'text-admin-text-sub hover:bg-admin-raised hover:text-admin-text'
                  )}
                >
                  {Icon && <Icon size={13} />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div className={contentClassName || ''}>{children}</div>
      </div>
    </div>
  );
}
