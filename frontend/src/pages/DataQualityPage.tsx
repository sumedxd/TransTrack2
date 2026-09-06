import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, FileText } from "lucide-react";
import type { Work } from "../types";
import { fetchWorks } from "../services/api";

interface Props {
  onSelectWork: (workId: string) => void;
}

export const DataQualityPage: React.FC<Props> = ({ onSelectWork }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      <div className="flex justify-center items-center h-80">
        <RefreshCw className="w-6 h-6 text-[#214E3B] animate-spin" />
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
  const incompleteStatus = works.filter((w) => w.work_status === "Completed" && !w.completion_date).length;

  const totalWarnings = missingCoords + invertedDates + negativeBalance + incompleteStatus;
  const warningRecordCount = works.filter((w) => {
    const hasMissingCoords = !w.latitude || !w.longitude;
    const hasInverted = w.sanction_date && w.completion_date && new Date(w.completion_date) < new Date(w.sanction_date);
    const hasOverrun = w.balance_amount < 0 || w.expenditure > w.sanctioned_amount;
    const hasIncomplete = w.work_status === "Completed" && !w.completion_date;
    return hasMissingCoords || hasInverted || hasOverrun || hasIncomplete;
  }).length;

  const warningPct = works.length > 0 ? ((warningRecordCount / works.length) * 100).toFixed(1) : "0.0";

  // Flagged records to inspect
  const flaggedWorks = works.filter((w) => {
    const hasInverted = w.sanction_date && w.completion_date && new Date(w.completion_date) < new Date(w.sanction_date);
    const hasOverrun = w.balance_amount < 0 || w.expenditure > w.sanctioned_amount;
    const hasIncomplete = w.work_status === "Completed" && !w.completion_date;
    return hasInverted || hasOverrun || hasIncomplete;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-[#DDDDD7] pb-4">
        <h2 className="text-base font-bold text-[#202321] tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#214E3B]" />
          Data Quality & Hygiene Audit
        </h2>
        <p className="text-xs text-[#6B706B]">
          Automated integrity checks: detects missing values, impossible chronological dates, negative disbursements, and status mismatches
        </p>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-sans">
        <div className="bg-white border border-[#DDDDD7] p-4 rounded-[8px] space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B706B] block">
            Records with Warnings
          </span>
          <span className="text-2xl font-bold font-numeric text-[#8A5B00] block">
            {warningPct}%
          </span>
          <span className="text-[11px] text-[#6B706B] block font-mono">
            {warningRecordCount} of {works.length} records
          </span>
        </div>

        <div className="bg-white border border-[#DDDDD7] p-4 rounded-[8px] space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B706B] block">
            Chronological Inversions
          </span>
          <span className="text-2xl font-bold font-numeric text-[#992222] block">
            {invertedDates}
          </span>
          <span className="text-[11px] text-[#6B706B] block">
            Completion before sanction
          </span>
        </div>

        <div className="bg-white border border-[#DDDDD7] p-4 rounded-[8px] space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B706B] block">
            Negative Balance / Overrun
          </span>
          <span className="text-2xl font-bold font-numeric text-[#A84D17] block">
            {negativeBalance}
          </span>
          <span className="text-[11px] text-[#6B706B] block">
            Expenditure &gt; Sanction
          </span>
        </div>

        <div className="bg-white border border-[#DDDDD7] p-4 rounded-[8px] space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B706B] block">
            Missing Coordinates
          </span>
          <span className="text-2xl font-bold font-numeric text-[#8A5B00] block">
            {missingCoords}
          </span>
          <span className="text-[11px] text-[#6B706B] block">
            Unmapped GPS values
          </span>
        </div>

        <div className="bg-white border border-[#DDDDD7] p-4 rounded-[8px] space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B706B] block">
            Missing Completion Dates
          </span>
          <span className="text-2xl font-bold font-numeric text-[#8A5B00] block">
            {incompleteStatus}
          </span>
          <span className="text-[11px] text-[#6B706B] block">
            Marked completed without date
          </span>
        </div>
      </div>

      {/* Flagged Records Audit List */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-[#DDDDD7]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#202321]">
            Integrity-Flagged Records Requiring Data Reconciliation
          </h3>
          <p className="text-[11px] text-[#6B706B]">
            Distinguishes potential administrative data-entry issues from operational irregularities
          </p>
        </div>

        <div className="divide-y divide-[#EFEFEA] text-xs">
          {flaggedWorks.length === 0 ? (
            <div className="p-8 text-center text-[#6B706B]">
              No high-severity data hygiene warnings detected in active records.
            </div>
          ) : (
            flaggedWorks.map((w) => (
              <div
                key={w.work_id}
                onClick={() => onSelectWork(w.work_id)}
                className="p-4 hover:bg-[#FAF9F5] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-[#214E3B]">{w.work_id}</span>
                    <span className="text-[#6B706B]">&bull;</span>
                    <span className="text-[#202321] font-sans">{w.district}</span>
                    <span className="text-[#6B706B]">&bull;</span>
                    <span className="text-[#8A5B00] bg-[#FDF8EE] border border-[#EEDAA2] px-2 py-0.5 rounded text-[10px] font-sans font-semibold">
                      {w.balance_amount < 0
                        ? "Negative Balance / Overrun"
                        : w.completion_date && w.sanction_date && new Date(w.completion_date) < new Date(w.sanction_date)
                        ? "Chronological Date Inversion"
                        : "Missing Date Record"}
                    </span>
                  </div>
                  <p className="text-xs text-[#202321] font-medium line-clamp-1">{w.work_description}</p>
                  <p className="text-[11px] text-[#6B706B] font-mono">
                    Sanction: {w.sanction_date || "None"} &bull; Completion: {w.completion_date || "None"} &bull; Balance: ₹{w.balance_amount?.toLocaleString("en-IN")}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWork(w.work_id);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#214E3B] hover:underline"
                >
                  Open Dossier <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
