// components/user/StatisticsCard.jsx
import React from "react";
import { TrendingUp } from "lucide-react";

const colorVariants = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-100",
  },
};

export default function StatisticsCard({ title, total, active, icon: Icon, color = "blue", extra }) {
  const colors = colorVariants[color];

  return (
    <div className={`rounded-xl border ${colors.border} bg-white p-4 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={18} className={colors.text} />
        </div>
        {active !== undefined && (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp size={10} />
            <span>{Math.round((active / total) * 100)}% Active</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800">{total}</p>
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