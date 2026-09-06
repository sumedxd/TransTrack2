import React from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  highlight?: boolean;
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtext,
  icon: Icon,
  highlight = false,
}) => {
  return (
    <div
      className={`bg-white border rounded-[8px] p-4 transition-shadow ${
        highlight
          ? "border-[#214E3B]/30 shadow-xs ring-1 ring-[#214E3B]/10"
          : "border-[#DDDDD7] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B706B]">
            {title}
          </p>
          <p className="text-2xl font-bold text-[#202321] mt-1 tracking-tight font-numeric">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-[#6B706B] mt-1 font-sans">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded bg-[#F6F5F1] text-[#214E3B] border border-[#E5E4DE]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};
