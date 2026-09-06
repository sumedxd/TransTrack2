import React from "react";
import { RefreshCw, UserCheck, Shield } from "lucide-react";

interface Props {
  onResetDemo: () => void;
  resetting: boolean;
}

export const Header: React.FC<Props> = ({ onResetDemo, resetting }) => {
  return (
    <header className="bg-white border-b border-[#DDDDD7] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[6px] bg-[#214E3B] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
          TT
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#202321] tracking-tight">
              TRANSTRACK 2
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#F4F3EE] text-[#555B55] border border-[#DDDDD7]">
              Audit Cell
            </span>
          </div>
          <p className="text-[11px] text-[#6B706B] tracking-normal">
            MPLADS Risk & Investigation Platform
          </p>
        </div>
      </div>

      {/* Right Meta & Actions */}
      <div className="flex items-center gap-4 text-xs text-[#6B706B]">
        <div className="hidden sm:flex items-center gap-2 border-r border-[#DDDDD7] pr-4">
          <span className="w-2 h-2 rounded-full bg-[#214E3B]" />
          <span className="font-mono text-[11px] text-[#4A4E4A]">
            Demo Baseline Active (250 Works)
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 border-r border-[#DDDDD7] pr-4">
          <UserCheck className="w-3.5 h-3.5 text-[#6B706B]" />
          <span className="text-[11px] text-[#202321] font-medium">
            Reviewer: CAG Audit Division
          </span>
        </div>

        <button
          onClick={onResetDemo}
          disabled={resetting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F6F5F1] hover:bg-[#ECEBE5] text-[#202321] border border-[#DDDDD7] transition text-xs font-medium disabled:opacity-50"
          title="Reset database to verified 250 demo records"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#214E3B] ${resetting ? "animate-spin" : ""}`} />
          <span>{resetting ? "Resetting..." : "Reset Data"}</span>
        </button>
      </div>
    </header>
  );
};
