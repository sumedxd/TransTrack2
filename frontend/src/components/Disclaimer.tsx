import React from "react";
import { ShieldCheck, Info } from "lucide-react";

export const Disclaimer: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[6px] px-3.5 py-2 flex items-center gap-2.5 text-xs text-[#6B706B]">
        <ShieldCheck className="w-4 h-4 text-[#214E3B] shrink-0" />
        <span>
          <strong className="text-[#202321] font-semibold">Auditor Decision-Support Notice:</strong> TransTrack 2 identifies statistical indicators to prioritize review. It does not establish corruption, fraud, or legal wrongdoing.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] border-l-3 border-l-[#214E3B] border-y border-r border-[#DDDDD7] p-4 rounded-r-[6px] text-xs leading-relaxed text-[#525752]">
      <div className="flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#214E3B] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold uppercase tracking-wider text-[#202321] block mb-1 text-[11px]">
            Institutional Monitoring & Decision-Support Disclaimer
          </span>
          This report is generated as an audit-prioritization aid for administrative scrutiny under the MPLADS guidelines. Analytical findings, statistical rankings, and agent outputs reflect anomalies in recorded operational data. They do not constitute formal charges, findings of malfeasance, or determinations of legal culpability. All priority flags require on-site physical inspection and verification of primary records.
        </div>
      </div>
    </div>
  );
};
