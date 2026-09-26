// components/user/StatisticsCard.jsx
import React from "react";
import { TrendingUp } from "lucide-react";

const colorVariants = {
  blue: {
    bg: "bg-admin-accent-soft",
    text: "text-admin-accent-text",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  purple: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
  },
  orange: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
  },
  indigo: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
  },
  pink: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
  },
};

export default function StatisticsCard({ title, total, active, icon: Icon, color = "blue", extra }) {
  const colors = colorVariants[color] || colorVariants.blue;

  return (
    <div className="admin-panel p-4 transition-colors hover:border-teal-300/60 dark:hover:border-teal-800">
      <div className="mb-3 flex items-center justify-between">
        <div className={`rounded-md p-2 ${colors.bg}`}>
          <Icon size={18} className={colors.text} />
        </div>
        {active !== undefined && total > 0 && (
          <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <TrendingUp size={10} />
            <span>{Math.round((active / total) * 100)}% Active</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-admin-text">{total}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">{title}</p>
      {active !== undefined && (
        <p className="mt-1 text-xs text-admin-muted">{active} active</p>
      )}
      {extra && (
        <p className="mt-1 truncate text-xs text-admin-muted">{extra}</p>
      )}
    </div>
  );
}
