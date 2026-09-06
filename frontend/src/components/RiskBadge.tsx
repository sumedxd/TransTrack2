import React from "react";
import type { RiskLevel } from "../types";

interface Props {
  level: RiskLevel | string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

export const RiskBadge: React.FC<Props> = ({ level, size = "md", showDot = true }) => {
  const norm = (level || "LOW").toUpperCase();

  const styles = {
    CRITICAL: "bg-[#FCEEEE] text-[#992222] border-[#F3C1C1]",
    HIGH: "bg-[#FDF4EE] text-[#A84D17] border-[#F4CFB7]",
    MEDIUM: "bg-[#FDF8EE] text-[#8A5B00] border-[#EEDAA2]",
    LOW: "bg-[#EEF5F0] text-[#235C3A] border-[#CCE0D2]",
  }[norm] || "bg-[#F0EFEA] text-[#4A4E4A] border-[#DDDDD7]";

  const dotColors = {
    CRITICAL: "bg-[#992222]",
    HIGH: "bg-[#A84D17]",
    MEDIUM: "bg-[#8A5B00]",
    LOW: "bg-[#235C3A]",
  }[norm] || "bg-[#6B706B]";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] font-semibold tracking-wider",
    md: "px-2.5 py-0.5 text-[11px] font-semibold tracking-wider",
    lg: "px-3 py-1 text-xs font-bold tracking-widest",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border ${styles} ${sizeClasses} uppercase font-sans`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors}`} />}
      {norm}
    </span>
  );
};
