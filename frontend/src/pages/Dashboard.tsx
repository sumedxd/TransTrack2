import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowRight,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  SearchCode,
  MapPin,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Building2,
  SlidersHorizontal,
  FolderSearch,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { DashboardSummary, Work } from "../types";
import { fetchSummary, fetchWorks, formatINR } from "../services/api";
import { RiskBadge } from "../components/RiskBadge";
import { StatCard } from "../components/StatCard";
import { Disclaimer } from "../components/Disclaimer";
import type { NavItem } from "../components/Sidebar";

interface Props {
  onSelectWork: (workId: string) => void;
  onNavigate?: (item: NavItem) => void;
  initialRiskFilter?: string;
  viewMode?: "overview" | "investigations";
}

export const Dashboard: React.FC<Props> = ({
  onSelectWork,
  onNavigate,
  initialRiskFilter = "",
  viewMode = "overview",
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [worksLoading, setWorksLoading] = useState<boolean>(false);

  // Filters & Pagination
  const [search, setSearch] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>(initialRiskFilter);
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
        limit: 12,
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
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#16A66A] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#64748B]">
          Synthesizing MPLADS risk portfolio...
        </p>
      </div>
    );
  }

  const priorityWorksCount =
    (summary?.critical_risk_count || 0) + (summary?.high_risk_count || 0);

  // Risk Donut Chart Data
  const riskChartData = [
    { name: "LOW", count: summary?.low_risk_count || 0, color: "#16A66A" },
    { name: "MEDIUM", count: summary?.medium_risk_count || 0, color: "#F5C542" },
    { name: "HIGH", count: summary?.high_risk_count || 0, color: "#F5A20A" },
    { name: "CRITICAL", count: summary?.critical_risk_count || 0, color: "#F43F5E" },
  ];

  // District Top 6 Bar Chart Data
  const districtData = (summary?.district_summary || []).slice(0, 6).map((d) => ({
    name: d.district,
    works: d.works_count,
    sanctioned: d.sanctioned / 10000000, // Cr
    highRisk: d.high_risk_count,
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HERO MISSION STATEMENT BANNER */}
      <section className="relative overflow-hidden bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl p-8 md:p-10 shadow-xs">
        {/* Abstract geometric background elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#16A66A]/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 right-40 w-48 h-48 bg-[#625BE8]/10 rounded-full blur-xl -mb-10 pointer-events-none" />
        <div className="absolute top-6 right-12 hidden lg:flex gap-3 pointer-events-none opacity-40">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#A7F3D0] rotate-12" />
          <div className="w-8 h-8 rounded-xl bg-[#16A66A] -rotate-6" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-[#16A66A] font-extrabold text-xs uppercase tracking-wider shadow-2xs border border-[#A7F3D0]">
            <span className="w-2 h-2 rounded-full bg-[#16A66A]" />
            MPLADS Risk & Audit Intelligence
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#064E3B] tracking-tight leading-tight">
            Monitoring MPLADS for Greater Impact
          </h1>

          <p className="text-base sm:text-lg text-[#047857] font-semibold leading-relaxed">
            Automatically identify MPLADS works that deserve closer scrutiny, explain exactly why they were flagged, and help authorities prioritize physical verification/audit.
          </p>

          {/* Key Audit Pillars */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-[#A7F3D0] text-xs font-bold text-[#064E3B]">
              <span className="w-2 h-2 rounded-full bg-[#625BE8]" />
              Automated Anomaly Detection
            </div>
            <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-[#A7F3D0] text-xs font-bold text-[#064E3B]">
              <span className="w-2 h-2 rounded-full bg-[#F5A20A]" />
              Explainable Evidence Traceability
            </div>
            <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-[#A7F3D0] text-xs font-bold text-[#064E3B]">
              <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
              Prioritized Physical Verification
            </div>
          </div>
        </div>
      </section>

      {/* 3. KPI CARDS: 5 Light-Tinted Metric Blocks */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Works"
            value={summary?.total_works || 0}
            subtext="Tracked projects"
            trend="100% Ingested"
            icon={FileSpreadsheet}
            theme="purple"
            onClick={() => setRiskFilter("")}
          />
          <StatCard
            title="Total Sanctioned"
            value={formatINR(summary?.total_sanctioned || 0)}
            subtext="Approved outlay"
            trend="Admin Outlay"
            icon={TrendingUp}
            theme="teal"
          />
          <StatCard
            title="Total Expenditure"
            value={formatINR(summary?.total_expenditure || 0)}
            subtext={`${summary?.overall_utilization || 0}% overall utilization`}
            trend="Disbursed"
            icon={Building2}
            theme="yellow"
          />
          <StatCard
            title="Completed Works"
            value={summary?.completed_works || 0}
            subtext="Physical completion"
            trend="Verified Status"
            icon={CheckCircle2}
            theme="green"
            onClick={() => setStatusFilter("COMPLETED")}
          />
          <StatCard
            title="Priority Works"
            value={priorityWorksCount}
            subtext="Requires verification"
            trend="High / Critical"
            icon={ShieldAlert}
            theme="pink"
            onClick={() => setRiskFilter("HIGH")}
          />
        </div>
      </section>

      {/* 4. ANALYTICS & RISK DISTRIBUTION: Donut + State Bar Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Card */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-[#1E293B]">
                Risk Distribution
              </h3>
              <span className="text-xs font-bold text-[#64748B]">Click tier to filter</span>
            </div>
            <p className="text-xs text-[#64748B]">
              Multi-agent analytical risk classifications
            </p>
          </div>

          <div className="my-4 flex items-center justify-center">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    cursor="pointer"
                    onClick={(entry: any) => setRiskFilter(entry?.name ? String(entry.name) : "")}
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} works`, `${name} Risk`]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-[#1E293B]">
                  {summary?.total_works || 0}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#94A3B8]">
                  Total Works
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Tier Badges */}
          <div className="grid grid-cols-2 gap-2.5">
            {riskChartData.map((item) => (
              <button
                key={item.name}
                onClick={() => setRiskFilter(riskFilter === item.name ? "" : item.name)}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition cursor-pointer text-xs ${
                  riskFilter === item.name
                    ? "border-[#1E293B] bg-[#F1F5F9] font-bold ring-1 ring-[#1E293B]"
                    : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-[#1E293B]">{item.name}</span>
                </div>
                <span className="font-mono font-extrabold text-sm text-[#334155]">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* District / State Breakdown Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-[#1E293B]">
                District Work Volume & Outlay
              </h3>
              <span className="text-xs font-semibold text-[#625BE8]">Sanctioned (₹ Cr)</span>
            </div>
            <p className="text-xs text-[#64748B]">
              Top district clusters by project volume & funding concentration
            </p>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#475569"
                  width={90}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, "Sanctioned"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                />
                <Bar dataKey="sanctioned" fill="#625BE8" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-[#F1F5F9] flex justify-between text-xs text-[#64748B]">
            <span>Showing top 6 audit districts</span>
            <button
              onClick={() => onNavigate ? onNavigate("analytics") : null}
              className="text-[#625BE8] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Analytics →
            </button>
          </div>
        </div>
      </section>

      {/* 5. PRIORITY WORKS TABLE: Modern, Filterable, Interactive */}
      <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#1E293B]">
              {viewMode === "investigations"
                ? "Active Investigations Register"
                : "Priority Works Register"}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {viewMode === "investigations"
                ? "Flagged MPLADS works undergoing multi-agent AI audit synthesis and empirical scrutiny"
                : "Auditable work entities ordered by analytical multi-agent risk score"}
            </p>
          </div>

          {/* Quick Risk Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRiskFilter(riskFilter === "HIGH" ? "" : "HIGH")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                riskFilter === "HIGH"
                  ? "bg-[#F5A20A] text-white border-[#F5A20A]"
                  : "bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5] hover:bg-[#FFEDD5]"
              }`}
            >
              High Risk Only
            </button>
            <button
              onClick={() => setRiskFilter(riskFilter === "CRITICAL" ? "" : "CRITICAL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                riskFilter === "CRITICAL"
                  ? "bg-[#F43F5E] text-white border-[#F43F5E]"
                  : "bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3] hover:bg-[#FFE4E6]"
              }`}
            >
              Critical Only
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Work ID, MP, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#16A66A] placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
          >
            <option value="">All Risk Classifications</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#16A66A] cursor-pointer"
          >
            <option value="">All Physical Stages</option>
            <option value="COMPLETED">Completed</option>
            <option value="ONGOING">Ongoing</option>
            <option value="DELAYED">Delayed</option>
            <option value="STALLED">Stalled</option>
            <option value="SANCTIONED">Sanctioned</option>
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
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Work ID</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4">Work Type</th>
                <th className="py-3.5 px-4 text-right">Sanctioned</th>
                <th className="py-3.5 px-4 text-right">Expenditure</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th
                  onClick={() => {
                    if (sortBy === "risk_score") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy("risk_score");
                      setSortOrder("desc");
                    }
                  }}
                  className="py-3.5 px-4 text-center cursor-pointer hover:text-[#1E293B]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Risk</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#1E293B]">
              {worksLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#64748B]">
                    <RefreshCw className="w-5 h-5 text-[#16A66A] animate-spin mx-auto mb-2" />
                    Filtering works...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#64748B]">
                    <AlertCircle className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#1E293B]">No works match your filters</p>
                    <p className="text-xs mt-1">Try resetting risk level or search keywords</p>
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
                    <td className="py-3.5 px-4 font-mono font-bold text-[#625BE8] group-hover:underline">
                      {w.work_id}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <span className="font-semibold block truncate text-[#1E293B]">
                        {w.work_description}
                      </span>
                      <span className="text-[11px] text-[#64748B]">MP: {w.mp_name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#475569]">{w.district}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] font-medium text-[11px]">
                        {w.work_type}
                      </span>
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
                      <RiskBadge level={w.risk_level || "LOW"} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWork(w.work_id);
                        }}
                        className="p-1.5 rounded-lg bg-[#F1F5F9] group-hover:bg-[#16A66A] group-hover:text-white text-[#64748B] transition"
                        title="Investigate Work"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
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
            <strong className="text-[#1E293B]">{totalCount}</strong> works
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
      </section>

      {/* Audit Disclaimer */}
      <Disclaimer />
    </div>
  );
};
