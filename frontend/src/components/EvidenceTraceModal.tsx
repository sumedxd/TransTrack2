import React from "react";
import { X, Calculator, Database, ShieldAlert, Sparkles, CheckCircle, ArrowUpRight } from "lucide-react";
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

  const isNumericCost = typeof data.observed === "number" && (data.metric.toLowerCase().includes("cost") || data.metric.toLowerCase().includes("amount") || data.metric.toLowerCase().includes("expenditure"));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#625BE8] flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4 text-[#625BE8]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1E293B]">
                Evidence Traceability
              </h3>
              <p className="text-[11px] text-[#64748B]">Auditable statistical and mathematical proof</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Finding Title & Summary */}
          <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#625BE8] block mb-1">
              Flagged Finding
            </span>
            <p className="font-bold text-base text-[#1E293B] leading-snug">{data.title}</p>
            {data.description && (
              <p className="text-[#64748B] text-xs mt-1.5 leading-relaxed">{data.description}</p>
            )}
          </div>

          {/* Observed vs Peer Benchmark */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#FFF1F2] p-4 rounded-2xl border border-[#FECDD3]">
              <span className="text-[11px] text-[#E11D48] font-bold uppercase tracking-wider block">
                Observed Value
              </span>
              <span className="text-xl font-extrabold text-[#9F1239] mt-1 block">
                {isNumericCost
                  ? formatINR(data.observed as number)
                  : String(data.observed)}
              </span>
            </div>

            <div className="bg-[#F0FDF4] p-4 rounded-2xl border border-[#DCFCE7]">
              <span className="text-[11px] text-[#16A34A] font-bold uppercase tracking-wider block">
                Peer Reference / Expected
              </span>
              <span className="text-xl font-extrabold text-[#14532D] mt-1 block">
                {typeof data.expected === "number" && isNumericCost
                  ? formatINR(data.expected)
                  : String(data.expected || "Normal Peer Median")}
              </span>
            </div>
          </div>

          {/* Mathematical / Agent Formula */}
          {data.calculation && (
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#625BE8]" />
                <span>Deterministic Calculation Formula</span>
              </div>
              <p className="font-mono text-xs font-bold text-[#1E293B] bg-white p-3 rounded-xl border border-[#E2E8F0]">
                {data.calculation}
              </p>
            </div>
          )}

          {/* Metadata rows */}
          <div className="space-y-2.5 border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B]">
            {data.referenceGroup && (
              <div className="flex justify-between items-center">
                <span>Peer Comparison Group:</span>
                <span className="font-bold text-[#1E293B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                  {data.referenceGroup}
                </span>
              </div>
            )}
            {data.datasetField && (
              <div className="flex justify-between items-center">
                <span>Source Dataset Field:</span>
                <span className="font-mono font-semibold text-[#625BE8]">
                  {data.datasetField}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Decision Support Classification:</span>
              <span className="text-[#16A66A] font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Verified Formula
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold text-xs transition cursor-pointer"
          >
            Close Evidence Window
          </button>
        </div>
      </div>
    </div>
  );
};
