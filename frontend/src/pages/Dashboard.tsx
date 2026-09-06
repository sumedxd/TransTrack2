import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import type { DashboardSummary, Work } from "../types";
import { fetchSummary, fetchWorks, formatINR } from "../services/api";
import { RiskBadge } from "../components/RiskBadge";
import { Disclaimer } from "../components/Disclaimer";

interface Props {
  onSelectWork: (workId: string) => void;
}

export const Dashboard: React.FC<Props> = ({ onSelectWork }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [worksLoading, setWorksLoading] = useState<boolean>(false);

  // Filters & Pagination
  const [search, setSearch] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("risk_score");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadSummary = async () => {
    try {
      const s = await fetchSummary();
      setSummary(s);
    } catch (e) {
      console.error("Failed to load summary", e);
    }
  };

  const loadWorks = async () => {
    try {
      setWorksLoading(true);
      const res = await fetchWorks({
        search: search.trim() || undefined,
        risk_level: riskFilter || undefined,
        status: statusFilter || undefined,
        district: districtFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 15,
      });
      setWorks(res.items);
      setTotalPages(res.total_pages);
      setTotalCount(res.total);
    } catch (e) {
      console.error("Failed to load works", e);
    } finally {
      setWorksLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadSummary();
      await loadWorks();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadWorks();
  }, [search, riskFilter, statusFilter, districtFilter, sortBy, sortOrder, page]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="w-6 h-6 text-[#214E3B] animate-spin" />
        <p className="text-xs font-mono text-[#6B706B]">
          Loading MPLADS monitoring overview...
        </p>
      </div>
    );
  }

  const priorityWorksCount =
    (summary?.critical_risk_count || 0) + (summary?.high_risk_count || 0);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. EDITORIAL HERO SECTION */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DDDDD7] pb-5">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#214E3B] block mb-1">
              National Monitoring Portfolio
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#202321] tracking-tight">
              MPLADS Monitoring Overview
            </h2>
            <p className="text-xs text-[#6B706B] mt-1 font-sans italic">
              &ldquo;Identify unusual works. Understand the evidence. Prioritize verification.&rdquo;
            </p>
          </div>
          <div className="text-xs text-[#6B706B] font-mono">
            Audit Jurisdiction: Lok Sabha / Rajya Sabha
          </div>
        </div>

        {/* 4 Essential Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B706B] block">
              Total Works
            </span>
            <span className="text-2xl font-bold text-[#202321] font-numeric block tracking-tight">
              {summary?.total_works.toLocaleString("en-IN") || 0}
            </span>
            <span className="text-[11px] text-[#6B706B] block">
              Active tracked projects
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B706B] block">
              Total Sanctioned
            </span>
            <span className="text-2xl font-bold text-[#202321] font-numeric block tracking-tight">
              {formatINR(summary?.total_sanctioned || 0)}
            </span>
            <span className="text-[11px] text-[#6B706B] block">
              Approved administrative outlay
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B706B] block">
              Total Expenditure
            </span>
            <span className="text-2xl font-bold text-[#202321] font-numeric block tracking-tight">
              {formatINR(summary?.total_expenditure || 0)}
            </span>
            <span className="text-[11px] text-[#214E3B] font-semibold block">
              {summary?.overall_utilization || 0}% overall utilization
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B706B] block">
              Priority Works
            </span>
            <span className="text-2xl font-bold text-[#A84D17] font-numeric block tracking-tight">
              {priorityWorksCount}
            </span>
            <span className="text-[11px] text-[#A84D17] font-medium block">
              Requires verification priority
            </span>
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL RISK DISTRIBUTION (EDITORIAL VISUAL FOCAL POINT) */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202321]">
              Risk Distribution Breakdown
            </h3>
            <p className="text-[11px] text-[#6B706B]">
              Distribution of works across multi-agent analytical risk classifications
            </p>
          </div>
          <span className="text-xs font-mono text-[#6B706B]">
            Total: {summary?.total_works || 0} works
          </span>
        </div>

        <div className="space-y-2.5 pt-1 font-sans text-xs">
          {summary?.risk_distribution.map((tier) => {
            const pct = summary.total_works > 0 ? (tier.count / summary.total_works) * 100 : 0;
            const barColors: Record<string, string> = {
              LOW: "bg-[#235C3A]",
              MEDIUM: "bg-[#8A5B00]",
              HIGH: "bg-[#A84D17]",
              CRITICAL: "bg-[#992222]",
            };
            const textColors: Record<string, string> = {
              LOW: "text-[#235C3A]",
              MEDIUM: "text-[#8A5B00]",
              HIGH: "text-[#A84D17]",
              CRITICAL: "text-[#992222]",
            };

            return (
              <div key={tier.tier} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-2 font-mono font-bold text-[11px]">
                  <span className={textColors[tier.tier] || "text-[#202321]"}>
                    {tier.tier}
                  </span>
                </div>
                <div className="col-span-7 bg-[#F6F5F1] rounded-[3px] h-4 overflow-hidden border border-[#E5E4DE]">
                  <div
                    className={`h-full ${barColors[tier.tier] || "bg-[#6B706B]"} rounded-[2px] transition-all duration-300`}
                    style={{ width: `${Math.max(pct, 1.5)}%` }}
                  />
                </div>
                <div className="col-span-3 text-right font-mono text-[11px] text-[#202321] flex items-center justify-end gap-2">
                  <span className="font-bold">{tier.count}</span>
                  <span className="text-[#6B706B]">({pct.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PRIORITY WORKS REGISTER TABLE */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 border-b border-[#DDDDD7] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#202321] uppercase tracking-wider">
                Priority Works Register
              </h3>
              <p className="text-xs text-[#6B706B]">
                Auditable work entities ordered by analytical risk score
              </p>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRiskFilter(riskFilter === "HIGH" ? "" : "HIGH")}
                className={`text-xs px-2.5 py-1 rounded-[4px] border font-sans transition ${
                  riskFilter === "HIGH"
                    ? "bg-[#FDF4EE] border-[#F4CFB7] text-[#A84D17] font-semibold"
                    : "bg-[#F6F5F1] border-[#DDDDD7] text-[#525752] hover:bg-[#ECEBE5]"
                }`}
              >
                High Risk Only
              </button>
              <button
                onClick={() => setRiskFilter(riskFilter === "CRITICAL" ? "" : "CRITICAL")}
                className={`text-xs px-2.5 py-1 rounded-[4px] border font-sans transition ${
                  riskFilter === "CRITICAL"
                    ? "bg-[#FCEEEE] border-[#F3C1C1] text-[#992222] font-semibold"
                    : "bg-[#F6F5F1] border-[#DDDDD7] text-[#525752] hover:bg-[#ECEBE5]"
                }`}
              >
                Critical Only
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B706B] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search Work ID, MP, description..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F5] border border-[#DDDDD7] rounded-[5px] text-xs text-[#202321] placeholder-[#8C918C] focus:outline-none focus:border-[#214E3B] font-sans"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[5px] px-2.5 py-1.5 text-xs text-[#202321] focus:outline-none focus:border-[#214E3B]"
            >
              <option value="">All Risk Classifications</option>
              <option value="CRITICAL">Critical (81–100)</option>
              <option value="HIGH">High (61–80)</option>
              <option value="MEDIUM">Medium (31–60)</option>
              <option value="LOW">Low (0–30)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[5px] px-2.5 py-1.5 text-xs text-[#202321] focus:outline-none focus:border-[#214E3B]"
            >
              <option value="">All Physical Stages</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Sanctioned">Sanctioned</option>
              <option value="Stalled">Stalled</option>
            </select>

            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[5px] px-2.5 py-1.5 text-xs text-[#202321] focus:outline-none focus:border-[#214E3B]"
            >
              <option value="">All Districts</option>
              {summary?.district_summary.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district} ({d.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#202321]">
            <thead className="bg-[#FAF9F5] border-b border-[#DDDDD7] text-[10px] uppercase tracking-wider text-[#6B706B] font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Work ID</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Category</th>
                <th
                  className="py-2.5 px-3 cursor-pointer select-none"
                  onClick={() => {
                    setSortBy("sanctioned_amount");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  <span className="flex items-center gap-1">
                    Sanctioned
                    {sortBy === "sanctioned_amount" && (
                      <ArrowUpDown className="w-3 h-3 text-[#214E3B]" />
                    )}
                  </span>
                </th>
                <th className="py-2.5 px-3">Expenditure</th>
                <th className="py-2.5 px-3">Status</th>
                <th
                  className="py-2.5 px-3 cursor-pointer select-none"
                  onClick={() => {
                    setSortBy("risk_score");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  <span className="flex items-center gap-1">
                    Risk
                    {sortBy === "risk_score" && (
                      <ArrowUpDown className="w-3 h-3 text-[#214E3B]" />
                    )}
                  </span>
                </th>
                <th className="py-2.5 px-3">Evidence Driver</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEA]">
              {worksLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-[#6B706B] font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5 text-[#214E3B]" />
                    Updating register...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-[#6B706B]">
                    <AlertCircle className="w-5 h-5 mx-auto mb-1 text-[#8C918C]" />
                    <p className="font-semibold text-xs text-[#202321]">
                      NO INVESTIGATIONS MATCH YOUR FILTERS
                    </p>
                    <p className="text-[11px] text-[#6B706B] mt-0.5">
                      Try adjusting: Risk level &bull; District &bull; Status &bull; Search terms
                    </p>
                  </td>
                </tr>
              ) : (
                works.map((w, idx) => {
                  const itemNumber = (page - 1) * 15 + idx + 1;
                  return (
                    <tr
                      key={w.work_id}
                      onClick={() => onSelectWork(w.work_id)}
                      className="hover:bg-[#F6F5F1] transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#6B706B]">
                        {String(itemNumber).padStart(2, "0")}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#214E3B] whitespace-nowrap">
                        {w.work_id}
                      </td>
                      <td
                        className="py-2.5 px-3 max-w-xs truncate text-[#202321]"
                        title={w.work_description}
                      >
                        {w.work_description}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#525752]">
                        {w.district}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#525752]">
                        {w.work_type}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-numeric font-medium text-[#202321]">
                        {formatINR(w.sanctioned_amount)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-numeric text-[#525752]">
                        {formatINR(w.expenditure)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-[#525752]">
                        {w.work_status}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <RiskBadge level={w.risk_level} size="sm" />
                      </td>
                      <td
                        className="py-2.5 px-3 text-[11px] text-[#6B706B] max-w-xs truncate"
                        title={w.top_finding}
                      >
                        {w.top_finding || "Normal operational parameters"}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectWork(w.work_id);
                          }}
                          className="inline-flex items-center gap-1 bg-[#214E3B] hover:bg-[#173729] text-white px-2 py-1 rounded-[4px] text-[11px] font-medium transition"
                        >
                          Investigate
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-[#DDDDD7] bg-[#FAF9F5] flex items-center justify-between text-xs font-mono text-[#6B706B]">
          <span>
            Page {page} of {totalPages || 1} ({totalCount} total records)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 bg-white border border-[#DDDDD7] rounded-[4px] text-[#202321] disabled:opacity-40 hover:bg-[#F6F5F1]"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 bg-white border border-[#DDDDD7] rounded-[4px] text-[#202321] disabled:opacity-40 hover:bg-[#F6F5F1]"
            >
              Next <ChevronRight className="w-3.5 h-3.5 inline" />
            </button>
          </div>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
};
