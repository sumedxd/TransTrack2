import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  RefreshCw,
  Info,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Calculator,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Coins,
  Clock,
  MapPin,
  TrendingUp,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import type { WorkInvestigationResult, AgentResponse } from "../types";
import { investigateWork, formatINR } from "../services/api";
import { RiskBadge } from "../components/RiskBadge";
import { Disclaimer } from "../components/Disclaimer";
import { EvidenceTraceModal, type TraceData } from "../components/EvidenceTraceModal";
import { WorkLocationMap } from "../maps/WorkLocationMap";

interface Props {
  workId: string;
  onBack: () => void;
  onSelectWork: (id: string) => void;
}

// Helper to clean, shorten, and format finding text across all investigations
const cleanAndShortenFinding = (raw: string): string => {
  if (!raw) return "";
  let s = raw.trim();

  // 1. Remove redundant regulatory boilerplate sentences
  s = s.replace(/\s*In MPLADS guidelines,.*$/i, "");
  s = s.replace(/\s*Government civil procurement,.*$/i, "");
  s = s.replace(/\s*The combination of project cost,.*$/i, "");
  s = s.replace(/\s*Physical on-site inspection is recommended.*$/i, "");
  s = s.replace(/\s*All findings must be corroborated.*$/i, "");
  s = s.replace(/\s*Decision function:\s*[-0-9.]+\)?/gi, "");

  // 2. Remove redundant category prefixes
  s = s.replace(/^Data Quality Issue:\s*[a-z0-9_]+:\s*/i, "Data Quality: ");
  s = s.replace(/^Multidimensional statistical outlier detected by Isolation Forest:\s*/i, "");
  s = s.replace(/^Substantial project cost deviation from peer median:\s*/i, "");
  s = s.replace(/^Expenditure exceeds administrative sanction limit:\s*/i, "");
  s = s.replace(/^Work marked completed with unusually brief duration:\s*/i, "");
  s = s.replace(/^Work execution delayed beyond statutory threshold:\s*/i, "");
  s = s.replace(/^High spatial fund concentration detected:\s*/i, "");
  s = s.replace(/^Implementing agency concentration detected:\s*/i, "");

  // 3. Format large unwieldy numbers like ₹3,250,000.00 to ₹32.50 L
  s = s.replace(/₹\s*([0-9,]+(?:\.[0-9]+)?)/g, (_, numStr) => {
    const n = parseFloat(numStr.replace(/,/g, ""));
    if (isNaN(n)) return `₹${numStr}`;
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${n.toLocaleString("en-IN")}`;
  });

  // 4. Simplify specific phrases
  s = s.replace(/Unsupervised Isolation Forest algorithm classified this work as an anomaly\s*\(Anomaly score:\s*([0-9.]+)\/100\)/i, "Isolation Forest flagged operational anomaly (Score: $1/100)");
  s = s.replace(/Chronological impossibility:\s*/i, "Chronological Inversion: ");

  // 5. Clean up awkward parenthesis spacing and multiple spaces
  s = s.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s{2,}/g, " ");

  return s.trim();
};

const renderCleanFinding = (text: string) => {
  return cleanAndShortenFinding(text);
};

export const Investigation: React.FC<Props> = ({ workId, onBack, onSelectWork }) => {
  const [data, setData] = useState<WorkInvestigationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showExecutive, setShowExecutive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "specialist" | "peers" | "map" | "ledger"
  >("overview");
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const result = await investigateWork(workId, forceRefresh);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load investigation details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#625BE8] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#64748B]">
          Synthesizing multi-agent evidence for {workId}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-[#F43F5E] mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-[#1E293B]">Unable to Load Investigation</h3>
        <p className="text-xs text-[#64748B] mt-1">{error || "Work record not found"}</p>
        <button
          onClick={onBack}
          className="mt-5 px-4 py-2 bg-[#16A66A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
        >
          Return to Works Register
        </button>
      </div>
    );
  }

  const { work, evidence_package, agent_responses, report, why_flagged, peer_comparison } = data;

  const handlePrint = () => {
    window.print();
  };

  const openTrace = (
    findingTitle: string,
    metric: string,
    observed: any,
    expected: any,
    calc?: string,
    desc?: string
  ) => {
    setTraceData({
      title: findingTitle,
      metric,
      observed,
      expected,
      calculation: calc,
      referenceGroup: peer_comparison?.peer_group_name,
      datasetField: metric,
      description: desc,
    });
  };

  const isPriority = work.risk_level === "CRITICAL" || work.risk_level === "HIGH";

  // Specialist Agents Configuration (4 Core Analytical Domains)
  const agents = [
    {
      key: "financial_agent",
      name: "Financial Agent",
      icon: Coins,
      accentBg: "bg-[#FFF7ED]",
      borderCol: "border-[#FFEDD5]",
      textColor: "text-[#EA580C]",
      solidCol: "bg-[#F5A20A]",
      role: "Cost & Overrun Auditing",
      resp: agent_responses?.financial_agent,
    },
    {
      key: "progress_agent",
      name: "Progress Agent",
      icon: Clock,
      accentBg: "bg-[#F5F3FF]",
      borderCol: "border-[#EDE9FE]",
      textColor: "text-[#625BE8]",
      solidCol: "bg-[#625BE8]",
      role: "Timeline & Velocity Analysis",
      resp: agent_responses?.progress_agent,
    },
    {
      key: "anomaly_agent",
      name: "Anomaly Detection Agent",
      icon: TrendingUp,
      accentBg: "bg-[#FFF1F2]",
      borderCol: "border-[#FFE4E6]",
      textColor: "text-[#E11D48]",
      solidCol: "bg-[#F43F5E]",
      role: "Unsupervised ML (Isolation Forest)",
      resp: agent_responses?.anomaly_agent,
    },
    {
      key: "data_quality_agent",
      name: "Data Quality Agent",
      icon: CheckCircle2,
      accentBg: "bg-[#F0FDF4]",
      borderCol: "border-[#DCFCE7]",
      textColor: "text-[#16A34A]",
      solidCol: "bg-[#16A66A]",
      role: "Record Consistency & Integrity",
      resp: agent_responses?.data_quality_agent,
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#1E293B] shadow-2xs transition cursor-pointer"
            title="Back to Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Investigation Case File
              </span>
              <span className="font-mono text-xs font-extrabold text-[#625BE8] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                {work.work_id}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-0.5">
              {work.work_description}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-xs font-semibold text-[#475569] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#625BE8] ${refreshing ? "animate-spin" : ""}`} />
            <span>Re-analyze</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. CASE BANNER: Metrics & Key Work Parameters */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
            Overall Risk Classification
          </span>
          <div className="flex items-center gap-2.5 mt-1.5">
            <RiskBadge level={work.risk_level} size="md" />
            <span className="font-mono text-lg font-extrabold text-[#1E293B]">
              {work.risk_score?.toFixed(1)}/100
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
            Evidence Confidence
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#16A66A] h-2.5 rounded-full"
                style={{ width: `${report.confidence || 85}%` }}
              />
            </div>
            <span className="font-mono font-bold text-xs text-[#1E293B]">
              {report.confidence || 85}%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
            Financial Outlay
          </span>
          <p className="text-base font-extrabold text-[#1E293B] mt-1 font-mono">
            {formatINR(work.sanctioned_amount)}{" "}
            <span className="text-xs text-[#64748B] font-normal">
              (Exp: {formatINR(work.expenditure)})
            </span>
          </p>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
            Location / Constituency
          </span>
          <p className="text-xs font-bold text-[#1E293B] mt-1 truncate">
            {work.district}, {work.state}
          </p>
          <span className="text-[11px] text-[#64748B] block truncate">
            MP: {work.mp_name} ({work.mp_house})
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">
            Physical Status
          </span>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#334155]">
            {work.work_status} ({work.work_type})
          </span>
        </div>
      </div>

      {/* 3. LEAD INVESTIGATOR AI SYNTHESIS: High-Contrast Distinct Section */}
      <section className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#625BE8] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">LEAD INVESTIGATOR</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/10 text-emerald-400 border border-white/10">
                  Multi-Agent Synthesis
                </span>
              </div>
              <p className="text-xs text-slate-400">Deterministic synthesis of 4 specialist analytical agents</p>
            </div>
          </div>
        </div>

        {/* PRIMARY CORROBORATING FINDINGS (Main Focal Point) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F5A20A]" />
              Primary Corroborating Findings
            </span>
            <span className="text-[11px] text-slate-400">Key empirical variances</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(report.key_findings || why_flagged || []).map((finding, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-white/5 hover:bg-white/8 border border-white/10 p-4 rounded-2xl transition"
              >
                <span className="font-mono text-xs font-extrabold text-[#F5A20A] bg-amber-500/20 px-2 py-0.5 rounded-lg shrink-0">
                  0{idx + 1}
                </span>
                <p className="text-xs text-white leading-relaxed">
                  {cleanAndShortenFinding(finding)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible Executive Assessment Dropdown */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowExecutive(!showExecutive)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-bold transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#625BE8]" />
              <span>Full Executive Assessment Synthesis</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>{showExecutive ? "Hide" : "View Dropdown"}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showExecutive ? "rotate-180" : ""}`} />
            </span>
          </button>

          {showExecutive && (
            <div className="mt-2.5 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed animate-in fade-in duration-150">
              "{report.executive_summary}"
            </div>
          )}
        </div>

        {/* RECOMMENDED ACTION BANNER AT THE BOTTOM */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-[#F43F5E] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Auditor Action Directive
              </span>
              <span className="text-xs font-bold text-white">Recommended Course of Action</span>
            </div>
          </div>

          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase text-center shadow-xs ${
              report.requires_physical_verification
                ? "bg-[#F43F5E] text-white ring-4 ring-rose-500/20"
                : "bg-[#16A66A] text-white"
            }`}
          >
            {report.recommendation || "PRIORITY PHYSICAL AUDIT & VERIFICATION"}
          </div>
        </div>
      </section>

      {/* 4. SPECIALIST AGENTS: 4 Interactive Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#1E293B]">Specialist Agent Findings</h2>
            <p className="text-xs text-[#64748B]">
              Independent analytical domains contributing to risk scoring
            </p>
          </div>
          <span className="text-xs text-[#64748B] font-medium">
            Click "View Evidence" for statistical proof
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const resp = agent.resp;
            const findings = resp?.findings || [];
            const topFinding = findings[0];

            return (
              <div
                key={agent.key}
                className={`rounded-3xl p-5 border ${agent.borderCol} ${agent.accentBg} shadow-xs flex flex-col justify-between card-hover`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl ${agent.solidCol} text-white flex items-center justify-center shadow-xs`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1E293B]">
                          {agent.name}
                        </h3>
                        <p className="text-[10px] text-[#64748B] font-medium">{agent.role}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        resp?.score && resp.score > 60
                          ? "bg-[#FFF1F2] text-[#E11D48]"
                          : resp?.score && resp.score > 30
                          ? "bg-[#FEFCE8] text-[#CA8A04]"
                          : "bg-[#F0FDF4] text-[#16A34A]"
                      }`}
                    >
                      {resp?.score ? `${resp.score.toFixed(0)}% Risk` : "Normal"}
                    </span>
                  </div>

                  {/* Top Finding Text */}
                  <div className="my-4 bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-white">
                    <p className="text-xs font-bold text-[#1E293B] leading-snug">
                      {cleanAndShortenFinding(topFinding?.title || "Conforms to expected peer baseline.")}
                    </p>
                    {topFinding?.description && (
                      <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
                        {cleanAndShortenFinding(topFinding.description)}
                      </p>
                    )}
                  </div>
                </div>

                {/* View Evidence Action Button */}
                <button
                  onClick={() =>
                    openTrace(
                      topFinding?.title || agent.name,
                      topFinding?.metric || "Peer analysis",
                      topFinding?.observed_value ?? (work.expenditure || "Normal"),
                      topFinding?.expected_value ?? (work.sanctioned_amount || "Peer Median"),
                      topFinding?.evidence?.join("; ") || `${agent.name} deterministic statistical formula`,
                      topFinding?.description
                    )
                  }
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-900 hover:text-white text-[#1E293B] border border-slate-200/80 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 group"
                >
                  <span>View Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. TABS: Peer Benchmarks, Spatial Map, Financial Ledger */}
      <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-6">
        {/* Tab Buttons */}
        <div className="flex border-b border-[#E2E8F0] gap-2 pb-2">
          {[
            { id: "overview", label: "Peer Comparison Group" },
            { id: "map", label: "Spatial Location Pin" },
            { id: "ledger", label: "Financial Outlay Ledger" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#16A66A] text-white shadow-xs"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Peer Benchmarks */}
        {activeTab === "overview" && peer_comparison && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">
                Peer Group Cluster
              </span>
              <p className="text-sm font-extrabold text-[#1E293B] mt-1">
                {peer_comparison.peer_group_name}
              </p>
              <span className="text-[11px] text-[#94A3B8]">
                Sample Size: {peer_comparison.peer_count} works
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">
                Peer Median Cost
              </span>
              <p className="text-sm font-extrabold text-[#1E293B] mt-1 font-mono">
                {formatINR(peer_comparison.median_cost)}
              </p>
              <span className="text-[11px] text-[#64748B]">
                Deviation: {peer_comparison.cost_deviation_pct > 0 ? `+${peer_comparison.cost_deviation_pct.toFixed(1)}%` : `${peer_comparison.cost_deviation_pct.toFixed(1)}%`}
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">
                Cost Percentile Rank
              </span>
              <p className="text-sm font-extrabold text-[#1E293B] mt-1 font-mono">
                {peer_comparison.cost_percentile.toFixed(1)}th
              </p>
              <span className="text-[11px] text-[#64748B]">
                {peer_comparison.cost_percentile >= 90 ? "Statistical Outlier" : "Normal Distribution"}
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] uppercase block">
                Median Duration
              </span>
              <p className="text-sm font-extrabold text-[#1E293B] mt-1 font-mono">
                {peer_comparison.median_duration || 180} Days
              </p>
              <span className="text-[11px] text-[#64748B]">Historical peer baseline</span>
            </div>
          </div>
        )}

        {/* Spatial Map Tab */}
        {activeTab === "map" && (
          <div className="h-80 w-full rounded-2xl overflow-hidden border border-[#E2E8F0]">
            <WorkLocationMap
              works={[work]}
              selectedWorkId={work.work_id}
              onSelectWork={() => {}}
            />
          </div>
        )}

        {/* Financial Ledger Tab */}
        {activeTab === "ledger" && (
          <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase">
                <tr>
                  <th className="p-3">Sanctioned Outlay</th>
                  <th className="p-3">Released Amount</th>
                  <th className="p-3">Reported Expenditure</th>
                  <th className="p-3">Unspent Balance</th>
                  <th className="p-3">Utilization Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] font-mono text-sm">
                <tr>
                  <td className="p-3 font-bold text-[#1E293B]">{formatINR(work.sanctioned_amount)}</td>
                  <td className="p-3 text-[#475569]">{formatINR(work.released_amount)}</td>
                  <td className="p-3 font-bold text-[#EA580C]">{formatINR(work.expenditure)}</td>
                  <td className="p-3 text-[#16A34A]">{formatINR(work.balance_amount)}</td>
                  <td className="p-3 font-bold text-[#625BE8]">{work.utilization_percentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Evidence Trace Modal */}
      <EvidenceTraceModal data={traceData} onClose={() => setTraceData(null)} />

      {/* Audit Disclaimer */}
      <Disclaimer />
    </div>
  );
};
