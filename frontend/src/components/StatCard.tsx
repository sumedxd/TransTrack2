import React from "react";
import type { LucideIcon } from "lucide-react";

export type StatTheme = "purple" | "teal" | "yellow" | "green" | "pink" | "white";

interface Props {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  theme?: StatTheme;
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtext,
  icon: Icon,
  theme = "white",
  trend,
  onClick,
}) => {
  const themeStyles = {
    purple: {
      card: "bg-[#F5F3FF] border-[#E0E7FF] text-[#4338CA]",
      iconBg: "bg-[#625BE8] text-white",
      badge: "bg-[#EEF2FF] text-[#4F46E5]",
      valueColor: "text-[#1E1B4B]",
    },
    teal: {
      card: "bg-[#F0FDFA] border-[#CCFBF1] text-[#0F766E]",
      iconBg: "bg-[#16B8A6] text-white",
      badge: "bg-[#CCFBF1] text-[#0D9488]",
      valueColor: "text-[#134E4A]",
    },
    yellow: {
      card: "bg-[#FEFCE8] border-[#FEF08A] text-[#A16207]",
      iconBg: "bg-[#F5A20A] text-white",
      badge: "bg-[#FEF9C3] text-[#854D0E]",
      valueColor: "text-[#713F12]",
    },
    green: {
      card: "bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]",
      iconBg: "bg-[#16A66A] text-white",
      badge: "bg-[#DCFCE7] text-[#166534]",
      valueColor: "text-[#14532D]",
    },
    pink: {
      card: "bg-[#FFF1F2] border-[#FFE4E6] text-[#BE123C]",
      iconBg: "bg-[#F43F5E] text-white",
      badge: "bg-[#FFE4E6] text-[#9F1239]",
      valueColor: "text-[#881337]",
    },
    white: {
      card: "bg-white border-[#E2E8F0] text-[#64748B]",
      iconBg: "bg-[#F1F5F9] text-[#475569]",
      badge: "bg-[#F1F5F9] text-[#475569]",
      valueColor: "text-[#1E293B]",
    },
  }[theme];

  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-5 shadow-xs card-hover ${themeStyles.card} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
            {title}
          </p>
          <p className={`text-3xl font-extrabold mt-1.5 tracking-tight font-numeric ${themeStyles.valueColor}`}>
            {value}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${themeStyles.badge}`}>
                {trend}
              </span>
            )}
            {subtext && (
              <p className="text-xs opacity-75 font-medium">{subtext}</p>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl shadow-xs shrink-0 ${themeStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
