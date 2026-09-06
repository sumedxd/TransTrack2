import React from "react";
import { RefreshCw, Bell, Search, UserCheck } from "lucide-react";

interface Props {
  onResetDemo: () => void;
  resetting: boolean;
  onSearchFocus?: () => void;
}

export const Header: React.FC<Props> = ({ onResetDemo, resetting, onSearchFocus }) => {
  return (
    <header className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Branding */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#16A66A] text-white flex items-center justify-center font-extrabold text-base tracking-tight shadow-sm">
          TT
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-[#1E293B] tracking-tight">
              TransTrack 2
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#16A66A] border border-[#A7F3D0]">
              Auditing Cell
            </span>
          </div>
          <p className="text-xs text-[#64748B] font-medium">
            MPLADS Risk & Investigation Platform
          </p>
        </div>
      </div>

      {/* Right Search, Notifications, Profile & Actions */}
      <div className="flex items-center gap-3 text-sm">
        {/* Quick Search Shortcut */}
        <button
          onClick={onSearchFocus}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] text-xs font-medium transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>Quick search works...</span>
          <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1] text-[#94A3B8]">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Icon with Indicator */}
        <div className="relative">
          <button
            className="w-9 h-9 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] flex items-center justify-center transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#64748B]" />
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F43F5E] rounded-full ring-2 ring-white" />
        </div>

        {/* User / Reviewer Badge */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="w-6 h-6 rounded-full bg-[#E0E7FF] text-[#625BE8] flex items-center justify-center font-bold text-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#625BE8]" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-bold text-[#1E293B] block">CAG Auditor</span>
            <span className="text-[10px] text-[#64748B] block">Lead Division</span>
          </div>
        </div>

        {/* Reset / Reload Demo Button */}
        <button
          onClick={onResetDemo}
          disabled={resetting}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#16A66A] hover:bg-[#138A58] text-white font-semibold shadow-xs transition text-xs disabled:opacity-50 cursor-pointer"
          title="Reset database to 250 baseline records"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
          <span>{resetting ? "Resetting..." : "Reset Data"}</span>
        </button>
      </div>
    </header>
  );
};
