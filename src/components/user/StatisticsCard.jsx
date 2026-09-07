// components/user/StatisticsCard.jsx
import React from "react";
import { TrendingUp } from "lucide-react";

const colorVariants = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-300",
    border: "border-slate-200 dark:border-slate-800",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-900/30",
    text: "text-pink-600 dark:text-pink-300",
    border: "border-slate-200 dark:border-slate-800",
  },
};

export default function StatisticsCard({ title, total, active, icon: Icon, color = "blue", extra }) {
  const colors = colorVariants[color];

  return (
    <div className={`rounded-xl border ${colors.border} bg-white p-4 transition-all hover:shadow-md dark:bg-slate-900`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={18} className={colors.text} />
        </div>
        {active !== undefined && (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-emerald-900/40 dark:text-emerald-300">
            <TrendingUp size={10} />
            <span>{Math.round((active / total) * 100)}% Active</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{total}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      {active !== undefined && (
        <p className="text-xs text-gray-400 mt-1">
          {active} active
        </p>
      )}
      {extra && (
        <p className="text-xs text-gray-400 mt-1 truncate">
          {extra}
        </p>
      )}
    </div>
  );
}