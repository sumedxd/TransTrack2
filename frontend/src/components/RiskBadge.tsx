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
    CRITICAL: "bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3] font-bold",
    HIGH: "bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5] font-bold",
    MEDIUM: "bg-[#FEFCE8] text-[#CA8A04] border-[#FEF08A] font-medium",
    LOW: "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7] font-medium",
  }[norm] || "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]";

  const dotColors = {
    CRITICAL: "bg-[#F43F5E] ring-2 ring-[#FECDD3]",
    HIGH: "bg-[#F5A20A] ring-2 ring-[#FFEDD5]",
    MEDIUM: "bg-[#F5C542] ring-2 ring-[#FEF08A]",
    LOW: "bg-[#16A66A] ring-2 ring-[#DCFCE7]",
  }[norm] || "bg-[#94A3B8]";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] tracking-wide",
    md: "px-2.5 py-1 text-xs tracking-wide",
    lg: "px-3.5 py-1.5 text-sm tracking-wider font-bold",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs ${styles} ${sizeClasses} uppercase`}
    >
      {showDot && <span className={`h-2 w-2 rounded-full ${dotColors} shrink-0`} />}
      {norm}
    </span>
  );
};
