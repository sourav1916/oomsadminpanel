import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

const MENU_Z = 99999;
const MENU_GAP = 8;
const MENU_PAD = 8;

/**
 * Portal + viewport-flip row action menu (⋮).
 * Matches CLIENT/context/action-button.md — no hover tooltip on the trigger.
 *
 * @param {Array}  actions|items - [{ label, icon, onClick, disabled, danger, warning, className }]
 *   `icon` may be a Lucide/react-icons component OR a React node.
 * @param {string} buttonClassName - optional trigger classes
 * @param {ReactNode} trigger - optional custom trigger (still no tooltip)
 */
export default function ActionMenu({
  actions,
  items,
  buttonClassName = '',
  trigger = null,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const visibleItems = (actions || items || []).filter(Boolean);

  const calcPos = useCallback(() => {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    const mH = menu?.offsetHeight || Math.max(44, visibleItems.length * 36 + 8);
    const mW = menu?.offsetWidth || 176;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Preferred order: top → bottom → right → left (action-button.md)
    const candidates = [
      { top: r.top - mH - MENU_GAP, left: r.right - mW },
      { top: r.bottom + MENU_GAP, left: r.right - mW },
      { top: r.top, left: r.right + MENU_GAP },
      { top: r.top, left: r.left - mW - MENU_GAP },
    ];

    const fits = (p) =>
      p.top >= MENU_PAD &&
      p.left >= MENU_PAD &&
      p.top + mH <= vh - MENU_PAD &&
      p.left + mW <= vw - MENU_PAD;

    const space = [
      r.top - MENU_PAD,
      vh - r.bottom - MENU_PAD,
      vw - r.right - MENU_PAD,
      r.left - MENU_PAD,
    ];
    let chosen = candidates.find(fits);
    if (!chosen) {
      let bestIdx = 1;
      space.forEach((s, i) => {
        if (s > space[bestIdx]) bestIdx = i;
      });
      chosen = candidates[bestIdx];
    }

    setPos({
      top: Math.min(Math.max(MENU_PAD, chosen.top), Math.max(MENU_PAD, vh - MENU_PAD - mH)),
      left: Math.min(Math.max(MENU_PAD, chosen.left), Math.max(MENU_PAD, vw - MENU_PAD - mW)),
    });
  }, [visibleItems.length]);

  useEffect(() => {
    if (!open) return undefined;
    const raf = requestAnimationFrame(() => calcPos());
    return () => cancelAnimationFrame(raf);
  }, [open, calcPos, visibleItems.length]);

  useEffect(() => {
    if (!open) return undefined;

    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const onClose = () => setOpen(false);
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', calcPos);
    window.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', calcPos);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, calcPos]);

  if (!visibleItems.length) return null;

  const renderIcon = (icon) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">{icon}</span>;
    }
    if (typeof icon === 'function') {
      const Icon = icon;
      return <Icon className="h-3.5 w-3.5 shrink-0" />;
    }
    return null;
  };

  return (
    <div className={`relative inline-flex ${className}`.trim()}>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={
          buttonClassName ||
          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-admin-muted transition-colors hover:bg-admin-raised hover:text-admin-text'
        }
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger || <MoreVertical className="h-4 w-4" />}
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'fixed',
                  top: pos.top,
                  left: pos.left,
                  zIndex: MENU_Z,
                  height: 'auto',
                }}
                className="min-w-[11rem] w-max max-w-[16rem] overflow-hidden rounded-xl border border-admin-border bg-admin-surface py-1 shadow-panel"
                onClick={(e) => e.stopPropagation()}
              >
                {visibleItems.map((item, index) => (
                  <button
                    key={item.label || index}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    title={item.title || undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.disabled) return;
                      setOpen(false);
                      item.onClick?.(e);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      item.danger
                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : item.warning
                          ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40'
                          : item.className ||
                            'text-admin-text-sub hover:bg-admin-raised hover:text-admin-text'
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
