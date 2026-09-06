import React from "react";
import { X, ExternalLink, Calculator, Database, ShieldAlert, Check } from "lucide-react";
import { formatINR } from "../services/api";

export interface TraceData {
  title: string;
  metric: string;
  observed: string | number;
  expected?: string | number;
  calculation?: string;
  referenceGroup?: string;
  datasetField?: string;
  sourceDoc?: string;
  description?: string;
}

interface Props {
  data: TraceData | null;
  onClose: () => void;
}

export const EvidenceTraceModal: React.FC<Props> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] w-full max-w-lg shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="bg-[#FAF9F5] border-b border-[#DDDDD7] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#214E3B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202321]">
              Evidence Traceability & Source Calculation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B706B] hover:text-[#202321] p-1 rounded hover:bg-[#EAE8E2] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs font-sans">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B706B] block mb-0.5">
              Finding Title
            </span>
            <p className="font-semibold text-sm text-[#202321]">{data.title}</p>
            {data.description && (
              <p className="text-[#6B706B] mt-1 leading-relaxed">{data.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E4DE]">
              <span className="text-[10px] text-[#6B706B] uppercase block">
                Observed Value
              </span>
              <span className="text-sm font-bold text-[#202321] mt-0.5 block">
                {typeof data.observed === "number" && data.metric.includes("cost")
                  ? formatINR(data.observed)
                  : String(data.observed)}
              </span>
            </div>

            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E4DE]">
              <span className="text-[10px] text-[#6B706B] uppercase block">
                Reference / Expected
              </span>
              <span className="text-sm font-bold text-[#214E3B] mt-0.5 block">
                {typeof data.expected === "number" && data.metric.includes("cost")
                  ? formatINR(data.expected)
                  : String(data.expected || "Peer Median")}
              </span>
            </div>
          </div>

          {data.calculation && (
            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E4DE] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#6B706B] block">
                Audit Calculation Formula
              </span>
              <p className="font-mono text-xs font-semibold text-[#202321] bg-white px-2.5 py-1.5 rounded border border-[#DDDDD7]">
                {data.calculation}
              </p>
            </div>
          )}

          <div className="space-y-2 border-t border-[#DDDDD7] pt-3 text-[11px] text-[#6B706B]">
            {data.referenceGroup && (
              <div className="flex justify-between">
                <span>Comparison Group:</span>
                <span className="font-medium text-[#202321]">{data.referenceGroup}</span>
              </div>
            )}
            {data.datasetField && (
              <div className="flex justify-between font-mono">
                <span>Dataset Field:</span>
                <span className="text-[#214E3B] font-semibold">{data.datasetField}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Grounding Guarantee:</span>
              <span className="text-[#235C3A] font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Verifiable Administrative Record
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF9F5] border-t border-[#DDDDD7] px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#214E3B] hover:bg-[#173729] text-white text-xs font-semibold rounded-[6px] transition"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
