import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Branding: Only Title and Icon */}
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
    </header>
  );
};

