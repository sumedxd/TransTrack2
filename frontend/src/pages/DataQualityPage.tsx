import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, FileText, Database, CalendarOff, ShieldAlert, ArrowRight } from "lucide-react";
import type { Work } from "../types";
import { fetchWorks } from "../services/api";

interface Props {
  onSelectWork: (workId: string) => void;
}

export const DataQualityPage: React.FC<Props> = ({ onSelectWork }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIssue, setSelectedIssue] = useState<string>("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWorks({ limit: 300 });
        setWorks(res.items);
      } catch (e) {
        console.error("Failed to fetch works for data quality audit", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FEFCE8] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#F5A20A] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#64748B]">
          Auditing dataset hygiene & completeness...
        </p>
      </div>
    );
  }

  // Calculate Data Quality Metrics across the loaded works
  const missingCoords = works.filter((w) => !w.latitude || !w.longitude).length;
  const invertedDates = works.filter((w) => {
    if (w.sanction_date && w.completion_date) {
      return new Date(w.completion_date) < new Date(w.sanction_date);
    }
    return false;
  }).length;
  const negativeBalance = works.filter((w) => w.balance_amount < 0 || w.expenditure > w.sanctioned_amount).length;
  const incompleteStatus = works.filter((w) => w.work_status === "COMPLETED" && !w.completion_date).length;

  const totalWarnings = missingCoords + invertedDates + negativeBalance + incompleteStatus;
  const warningRecordCount = works.filter((w) => {
    const hasMissingCoords = !w.latitude || !w.longitude;
    const hasInverted = w.sanction_date && w.completion_date && new Date(w.completion_date) < new Date(w.sanction_date);
    const hasOverrun = w.balance_amount < 0 || w.expenditure > w.sanctioned_amount;
    const hasIncomplete = w.work_status === "COMPLETED" && !w.completion_date;
    return hasMissingCoords || hasInverted || hasOverrun || hasIncomplete;
  }).length;

  const warningPct = works.length > 0 ? ((warningRecordCount / works.length) * 100).toFixed(1) : "0.0";

  // Flagged records based on selection
  const flaggedWorks = works.filter((w) => {
    const hasInverted = w.sanction_date && w.completion_date && new Date(w.completion_date) < new Date(w.sanction_date);
    const hasOverrun = w.balance_amount < 0 || w.expenditure > w.sanctioned_amount;
    const hasMissingCoords = !w.latitude || !w.longitude;
    const hasIncomplete = w.work_status === "COMPLETED" && !w.completion_date;

    if (selectedIssue === "INVERTED") return hasInverted;
    if (selectedIssue === "OVERRUN") return hasOverrun;
    if (selectedIssue === "COORDS") return hasMissingCoords;
    if (selectedIssue === "INCOMPLETE") return hasIncomplete;
    return hasInverted || hasOverrun || hasMissingCoords || hasIncomplete;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A66A] bg-[#ECFDF5] px-2.5 py-0.5 rounded-md border border-[#A7F3D0]">
              Hygiene & Integrity Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1 flex items-center gap-2">
            Data Quality Audit
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Automated integrity checks: chronological validity, expenditure balance, coordinate completeness
          </p>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setSelectedIssue("ALL")}
          className={`p-5 rounded-3xl border transition cursor-pointer card-hover ${
            selectedIssue === "ALL"
              ? "bg-[#FEFCE8] border-[#FEF08A] ring-2 ring-[#F5A20A]"
              : "bg-[#FEFCE8] border-[#FEF08A]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A16207] block">
            Records with Issues
          </span>
          <span className="text-3xl font-extrabold font-numeric text-[#713F12] mt-1.5 block">
            {warningPct}%
          </span>
          <span className="text-xs text-[#854D0E] font-medium mt-1 block">
            {warningRecordCount} of {works.length} records
          </span>
        </div>

        <div
          onClick={() => setSelectedIssue("INVERTED")}
          className={`p-5 rounded-3xl border transition cursor-pointer card-hover ${
            selectedIssue === "INVERTED"
              ? "bg-[#FFF1F2] border-[#FECDD3] ring-2 ring-[#F43F5E]"
              : "bg-[#FFF1F2] border-[#FECDD3]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48] block">
            Date Inversions
          </span>
          <span className="text-3xl font-extrabold font-numeric text-[#9F1239] mt-1.5 block">
            {invertedDates}
          </span>
          <span className="text-xs text-[#BE123C] font-medium mt-1 block">
            Completion before sanction
          </span>
        </div>

        <div
          onClick={() => setSelectedIssue("OVERRUN")}
          className={`p-5 rounded-3xl border transition cursor-pointer card-hover ${
            selectedIssue === "OVERRUN"
              ? "bg-[#FFF7ED] border-[#FFEDD5] ring-2 ring-[#F5A20A]"
              : "bg-[#FFF7ED] border-[#FFEDD5]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#EA580C] block">
            Budget Overruns
          </span>
          <span className="text-3xl font-extrabold font-numeric text-[#C2410C] mt-1.5 block">
            {negativeBalance}
          </span>
          <span className="text-xs text-[#9A3412] font-medium mt-1 block">
            Expenditure &gt; Sanction
          </span>
        </div>

        <div
          onClick={() => setSelectedIssue("COORDS")}
          className={`p-5 rounded-3xl border transition cursor-pointer card-hover ${
            selectedIssue === "COORDS"
              ? "bg-[#F5F3FF] border-[#EDE9FE] ring-2 ring-[#625BE8]"
              : "bg-[#F5F3FF] border-[#EDE9FE]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#625BE8] block">
            Missing Coords
          </span>
          <span className="text-3xl font-extrabold font-numeric text-[#4338CA] mt-1.5 block">
            {missingCoords}
          </span>
          <span className="text-xs text-[#4F46E5] font-medium mt-1 block">
            Unmapped GPS values
          </span>
        </div>

        <div
          onClick={() => setSelectedIssue("INCOMPLETE")}
          className={`p-5 rounded-3xl border transition cursor-pointer card-hover ${
            selectedIssue === "INCOMPLETE"
              ? "bg-[#F0FDFA] border-[#CCFBF1] ring-2 ring-[#16B8A6]"
              : "bg-[#F0FDFA] border-[#CCFBF1]"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] block">
            Missing End Dates
          </span>
          <span className="text-3xl font-extrabold font-numeric text-[#0F766E] mt-1.5 block">
            {incompleteStatus}
          </span>
          <span className="text-xs text-[#115E59] font-medium mt-1 block">
            Completed without date
          </span>
        </div>
      </div>

      {/* Flagged Records Audit List */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#1E293B]">
              Integrity-Flagged Records ({flaggedWorks.length})
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Distinguishes potential administrative clerical errors from operational anomalies
            </p>
          </div>
          <span className="text-xs font-bold text-[#625BE8] bg-[#EEF2FF] px-3 py-1 rounded-xl">
            Filter: {selectedIssue}
          </span>
        </div>

        <div className="divide-y divide-[#F1F5F9] text-xs">
          {flaggedWorks.length === 0 ? (
            <div className="p-12 text-center text-[#64748B]">
              <CheckCircle2 className="w-8 h-8 text-[#16A66A] mx-auto mb-2" />
              <p className="font-bold text-sm text-[#1E293B]">No data hygiene issues in this filter category</p>
            </div>
          ) : (
            flaggedWorks.map((w) => (
              <div
                key={w.work_id}
                onClick={() => onSelectWork(w.work_id)}
                className="p-5 hover:bg-[#F8FAFC] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-extrabold text-[#625BE8] text-sm group-hover:underline">
                      {w.work_id}
                    </span>
                    <span className="text-[#94A3B8]">&bull;</span>
                    <span className="text-[#1E293B] font-sans font-bold">{w.district}</span>
                    <span className="text-[#94A3B8]">&bull;</span>
                    <span className="text-[#E11D48] bg-[#FFF1F2] border border-[#FECDD3] px-2.5 py-0.5 rounded-full text-[10px] font-sans font-extrabold">
                      {w.balance_amount < 0
                        ? "Negative Balance / Overrun"
                        : w.completion_date && w.sanction_date && new Date(w.completion_date) < new Date(w.sanction_date)
                        ? "Chronological Date Inversion"
                        : !w.latitude || !w.longitude
                        ? "Missing GPS Coordinates"
                        : "Missing Date Record"}
                    </span>
                  </div>
                  <p className="text-xs text-[#1E293B] font-semibold">{w.work_description}</p>
                  <p className="text-[11px] text-[#64748B] font-mono">
                    Sanction: {w.sanction_date || "None"} &bull; Completion: {w.completion_date || "None"} &bull; Balance: ₹{w.balance_amount?.toLocaleString("en-IN")}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWork(w.work_id);
                  }}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-[#F1F5F9] group-hover:bg-[#16A66A] group-hover:text-white text-[#1E293B] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
