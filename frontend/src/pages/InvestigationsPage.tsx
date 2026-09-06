import React, { useState, useEffect } from "react";
import {
  Search,
  SearchCode,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import type { Work, DashboardSummary } from "../types";
import { fetchWorks, fetchSummary, formatINR } from "../services/api";
import { RiskBadge } from "../components/RiskBadge";

interface Props {
  onSelectWork: (workId: string) => void;
}

export const InvestigationsPage: React.FC<Props> = ({ onSelectWork }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [worksLoading, setWorksLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("HIGH");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("risk_score");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadData = async () => {
    try {
      setWorksLoading(true);
      const [worksRes, sumRes] = await Promise.all([
        fetchWorks({
          search: search.trim() || undefined,
          risk_level: riskFilter || undefined,
          district: districtFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          limit: 12,
        }),
        summary ? Promise.resolve(summary) : fetchSummary(),
      ]);

      setWorks(worksRes.items);
      setTotalPages(worksRes.total_pages);
      setTotalCount(worksRes.total);
      if (!summary) setSummary(sumRes);
    } catch (e) {
      console.error("Failed to load active investigations", e);
    } finally {
      setLoading(false);
      setWorksLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, riskFilter, districtFilter, sortBy, sortOrder, page]);

  if (loading && !works.length) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#E11D48] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#64748B]">
          Synthesizing active audit investigations...
        </p>
      </div>
    );
  }

  const criticalCount = summary?.critical_risk_count || 0;
  const highCount = summary?.high_risk_count || 0;
  const priorityTotal = criticalCount + highCount;

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E11D48] bg-[#FFF1F2] px-2.5 py-0.5 rounded-md border border-[#FECDD3]">
              Active Audit Dossiers
            </span>
            <span className="text-xs text-[#64748B] font-mono font-semibold">
              {priorityTotal} Prioritized Cases
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1 flex items-center gap-2">
            Active Investigations
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Works flagged by multi-agent empirical synthesis for prioritized audit review & on-site verification
          </p>
        </div>
      </div>

      {/* Metric Quick-Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setRiskFilter("");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            riskFilter === ""
              ? "bg-[#1E293B] text-white border-[#1E293B] shadow-sm"
              : "bg-white text-[#1E293B] border-[#E2E8F0] hover:border-slate-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              All Portfolios
            </span>
            <SearchCode className={`w-4 h-4 ${riskFilter === "" ? "text-white" : "text-[#64748B]"}`} />
          </div>
          <p className="text-2xl font-mono font-extrabold mt-2">
            {summary?.total_works || 0}
          </p>
          <span className={`text-[11px] ${riskFilter === "" ? "text-slate-300" : "text-[#64748B]"}`}>
            Total tracked works
          </span>
        </div>

        <div
          onClick={() => {
            setRiskFilter("CRITICAL");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            riskFilter === "CRITICAL"
              ? "bg-[#F43F5E] text-white border-[#F43F5E] shadow-sm"
              : "bg-white text-[#1E293B] border-[#E2E8F0] hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${riskFilter === "CRITICAL" ? "text-rose-100" : "text-[#E11D48]"}`}>
              Critical Priority
            </span>
            <ShieldAlert className={`w-4 h-4 ${riskFilter === "CRITICAL" ? "text-white" : "text-[#E11D48]"}`} />
          </div>
          <p className="text-2xl font-mono font-extrabold mt-2">
            {criticalCount}
          </p>
          <span className={`text-[11px] ${riskFilter === "CRITICAL" ? "text-rose-100" : "text-[#64748B]"}`}>
            Immediate physical inspection
          </span>
        </div>

        <div
          onClick={() => {
            setRiskFilter("HIGH");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            riskFilter === "HIGH"
              ? "bg-[#F5A20A] text-white border-[#F5A20A] shadow-sm"
              : "bg-white text-[#1E293B] border-[#E2E8F0] hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${riskFilter === "HIGH" ? "text-amber-100" : "text-[#EA580C]"}`}>
              High Priority
            </span>
            <AlertTriangle className={`w-4 h-4 ${riskFilter === "HIGH" ? "text-white" : "text-[#F5A20A]"}`} />
          </div>
          <p className="text-2xl font-mono font-extrabold mt-2">
            {highCount}
          </p>
          <span className={`text-[11px] ${riskFilter === "HIGH" ? "text-amber-100" : "text-[#64748B]"}`}>
            Auditor review recommended
          </span>
        </div>

        <div
          onClick={() => {
            setRiskFilter("MEDIUM");
            setPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            riskFilter === "MEDIUM"
              ? "bg-[#625BE8] text-white border-[#625BE8] shadow-sm"
              : "bg-white text-[#1E293B] border-[#E2E8F0] hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${riskFilter === "MEDIUM" ? "text-indigo-100" : "text-[#625BE8]"}`}>
              Medium Vigilance
            </span>
            <TrendingUp className={`w-4 h-4 ${riskFilter === "MEDIUM" ? "text-white" : "text-[#625BE8]"}`} />
          </div>
          <p className="text-2xl font-mono font-extrabold mt-2">
            {summary?.medium_risk_count || 0}
          </p>
          <span className={`text-[11px] ${riskFilter === "MEDIUM" ? "text-indigo-100" : "text-[#64748B]"}`}>
            Desk verification review
          </span>
        </div>
      </div>

      {/* Main Filter & Investigation Table Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-5">
        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0]">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Work ID, MP, Village..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#16A66A] placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
          >
            <option value="">All Risk Classifications</option>
            <option value="CRITICAL">Critical Risk Only</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
          >
            <option value="">All Districts</option>
            {(summary?.district_summary || []).map((d) => (
              <option key={d.district} value={d.district}>
                {d.district} ({d.works_count})
              </option>
            ))}
          </select>

          {/* Sort Control */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
          >
            <option value="risk_score-desc">Highest Risk Score</option>
            <option value="risk_score-asc">Lowest Risk Score</option>
            <option value="sanctioned_amount-desc">Highest Sanctioned Amount</option>
            <option value="expenditure-desc">Highest Expenditure</option>
          </select>
        </div>

        {/* Investigations List */}
        <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Work ID</th>
                <th className="py-3.5 px-4">Description & Location</th>
                <th className="py-3.5 px-4">Executing Agency</th>
                <th className="py-3.5 px-4 text-right">Sanctioned</th>
                <th className="py-3.5 px-4 text-right">Expenditure</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Risk Level</th>
                <th className="py-3.5 px-4 text-center">Investigation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#1E293B]">
              {worksLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-5 h-5 text-[#E11D48] animate-spin mx-auto mb-2" />
                    Filtering active investigations...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#64748B]">
                    <SearchCode className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#1E293B]">No investigations match your filters</p>
                    <p className="text-xs mt-1">Try resetting the risk filter or search keywords</p>
                  </td>
                </tr>
              ) : (
                works.map((w, idx) => (
                  <tr
                    key={w.work_id}
                    onClick={() => onSelectWork(w.work_id)}
                    className="hover:bg-[#F8FAFC] transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-[#94A3B8] text-[11px]">
                      {(page - 1) * 12 + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#625BE8] group-hover:underline whitespace-nowrap">
                      {w.work_id}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <span className="font-semibold block text-[#1E293B] truncate">
                        {w.work_description}
                      </span>
                      <span className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#94A3B8]" />
                        {w.district}, {w.state} &bull; MP: {w.mp_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#475569]">
                      {w.implementing_agency || "State PWD / Zilla Parishad"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E293B]">
                      {formatINR(w.sanctioned_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#475569]">
                      {formatINR(w.expenditure)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          w.work_status === "COMPLETED"
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : w.work_status === "ONGOING"
                            ? "bg-[#FEF9C3] text-[#854D0E]"
                            : w.work_status === "DELAYED"
                            ? "bg-[#FFEDD5] text-[#9A3412]"
                            : w.work_status === "STALLED"
                            ? "bg-[#FEE2E2] text-[#991B1B]"
                            : "bg-[#F1F5F9] text-[#475569]"
                        }`}
                      >
                        {w.work_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <RiskBadge level={w.risk_level || "LOW"} size="sm" />
                        <span className="font-mono text-[10px] font-bold text-[#64748B]">
                          {w.risk_score?.toFixed(1)}/100
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWork(w.work_id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E293B] group-hover:bg-[#16A66A] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] pt-2">
          <span>
            Showing <strong className="text-[#1E293B]">{works.length}</strong> of{" "}
            <strong className="text-[#1E293B]">{totalCount}</strong> active investigations
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 transition font-semibold cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="px-2 font-mono font-bold text-[#1E293B]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 transition font-semibold cursor-pointer flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
