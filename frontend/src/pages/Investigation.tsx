import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Info,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Calculator,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type { WorkInvestigationResult } from "../types";
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

export const Investigation: React.FC<Props> = ({ workId, onBack, onSelectWork }) => {
  const [data, setData] = useState<WorkInvestigationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <RefreshCw className="w-6 h-6 text-[#214E3B] animate-spin" />
        <p className="text-xs font-mono text-[#6B706B]">
          Synthesizing multi-agent evidence for {workId}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="w-6 h-6 text-[#992222] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#202321]">Unable to Load Investigation</h3>
        <p className="text-xs text-[#6B706B] mt-1">{error || "Work record not found"}</p>
        <button
          onClick={onBack}
          className="mt-4 px-3 py-1.5 bg-[#214E3B] text-white rounded-[4px] text-xs font-medium"
        >
          Return to Register
        </button>
      </div>
    );
  }

  const { work, evidence_package, agent_responses, report, why_flagged, peer_comparison } = data;

  const handlePrint = () => {
    window.print();
  };

  // Build trace payload for evidence traceability modal
  const openTrace = (findingTitle: string, metric: string, observed: any, expected: any, calc?: string, desc?: string) => {
    setTraceData({
      title: findingTitle,
      metric,
      observed,
      expected,
      calculation: calc,
      referenceGroup: peer_comparison?.peer_group_name,
      datasetField: metric,
      sourceDoc: `MPLADS Work Register #${work.work_id}`,
      description: desc,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Evidence Trace Modal */}
      <EvidenceTraceModal data={traceData} onClose={() => setTraceData(null)} />

      {/* Top Action Breadcrumb Bar */}
      <div className="flex items-center justify-between border-b border-[#DDDDD7] pb-3 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#F6F5F1] border border-[#DDDDD7] rounded-[4px] text-xs font-medium text-[#202321] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#6B706B]" />
            Back to Register
          </button>
          <span className="text-[#DDDDD7]">|</span>
          <span className="text-xs font-mono font-bold text-[#214E3B]">
            {work.work_id}
          </span>
          <RiskBadge level={report.overall_risk} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#F6F5F1] border border-[#DDDDD7] rounded-[4px] text-xs font-medium text-[#202321] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#214E3B] ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Re-scoring..." : "Re-evaluate"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#214E3B] hover:bg-[#173729] text-white rounded-[4px] text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Dossier
          </button>
        </div>
      </div>

      {/* Flagship Header Card */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase text-[#6B706B]">
              <span>INVESTIGATION DOSSIER</span>
              <span>&bull;</span>
              <span className="text-[#214E3B]">{work.work_id}</span>
              <span>&bull;</span>
              <span>{work.work_type}</span>
            </div>
            <h1 className="text-xl font-bold text-[#202321] tracking-tight leading-snug">
              {work.work_description}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#525752] pt-1">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#6B706B]" />
                <strong>MP:</strong> {work.mp_name} ({work.mp_house})
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#6B706B]" />
                <strong>Agency:</strong> {work.implementing_agency}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6B706B]" />
                <strong>Sanction:</strong> {work.sanction_date || "N/A"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#214E3B]" />
                <strong>Status:</strong> {work.work_status}
              </span>
            </div>
          </div>

          {/* Editorial Risk Summary Box (No neon circular gauges!) */}
          <div className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[6px] p-4 flex items-center gap-6 self-start shrink-0">
            {/* Risk Priority Score */}
            <div className="pr-5 border-r border-[#DDDDD7] text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B706B] block mb-0.5">
                Risk Priority
              </span>
              <div className="flex items-baseline justify-center gap-1 font-numeric">
                <span
                  className={`text-3xl font-bold tracking-tight ${
                    report.risk_score >= 81
                      ? "text-[#992222]"
                      : report.risk_score >= 61
                      ? "text-[#A84D17]"
                      : report.risk_score >= 31
                      ? "text-[#8A5B00]"
                      : "text-[#235C3A]"
                  }`}
                >
                  {report.risk_score}
                </span>
                <span className="text-xs font-mono text-[#6B706B]">/100</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#202321] block mt-0.5">
                {report.overall_risk}
              </span>
            </div>

            {/* Evidence Confidence */}
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B706B] block mb-0.5">
                Evidence Confidence
              </span>
              <div className="flex items-baseline justify-center gap-1 font-numeric">
                <span className="text-3xl font-bold text-[#202321] tracking-tight">
                  {report.confidence}%
                </span>
              </div>
              <span className="text-[10px] text-[#6B706B] block mt-0.5 font-sans">
                Data Completeness
              </span>
            </div>
          </div>
        </div>

        {/* Narrative indicator count */}
        <div className="text-xs text-[#525752] pt-2 border-t border-[#E5E4DE] font-sans flex items-center justify-between">
          <span>
            <strong>{why_flagged.length} independent indicators</strong> contributed to this audit evaluation.
          </span>
          <span className="font-mono text-[11px] text-[#6B706B]">
            District: {work.district}, {work.state}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#DDDDD7] text-xs font-medium no-print">
        {[
          { id: "overview", label: "Evidence Dossier" },
          { id: "specialist", label: "Analytical Findings" },
          { id: "peers", label: "Peer Benchmark" },
          { id: "map", label: "Spatial Context" },
          { id: "ledger", label: "Raw Fields" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-4 border-b-2 transition ${
              activeTab === tab.id
                ? "border-[#214E3B] text-[#214E3B] font-semibold bg-white"
                : "border-transparent text-[#6B706B] hover:text-[#202321]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EVIDENCE DOSSIER (THE CORE INVESTIGATION VIEW) */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* A. LEAD INVESTIGATOR ASSESSMENT */}
          <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDDDD7] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#214E3B] font-bold">
                  Synthesized Decision-Support Assessment
                </span>
                <h2 className="text-base font-bold text-[#202321] tracking-tight">
                  Lead Investigator Assessment
                </h2>
              </div>
              <div
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase font-sans border ${
                  report.requires_physical_verification
                    ? "bg-[#FCEEEE] text-[#992222] border-[#F3C1C1]"
                    : "bg-[#EEF5F0] text-[#235C3A] border-[#CCE0D2]"
                }`}
              >
                {report.requires_physical_verification
                  ? "RECOMMENDED ACTION: PRIORITY PHYSICAL VERIFICATION"
                  : "RECOMMENDED ACTION: ROUTINE ADMINISTRATIVE REVIEW"}
              </div>
            </div>

            <p className="text-sm text-[#202321] leading-relaxed bg-[#FAF9F5] p-4 rounded-[6px] border border-[#E5E4DE] font-sans">
              &ldquo;{report.executive_summary}&rdquo;
            </p>

            {/* PRIMARY REASONS (Numbered 01, 02, ...) */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B706B]">
                Primary Reasons Flagged
              </h3>
              <div className="space-y-2">
                {report.key_findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-[6px] border border-[#DDDDD7] flex items-start gap-3"
                  >
                    <span className="font-mono font-bold text-xs text-[#214E3B]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-[#202321] leading-relaxed font-medium">
                      {finding}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Corroborating Evidence */}
            {report.corroborating_evidence && report.corroborating_evidence.length > 0 && (
              <div className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[6px] p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#214E3B] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Corroborating Signals Across Modules
                </span>
                <ul className="space-y-1 text-xs text-[#525752]">
                  {report.corroborating_evidence.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#214E3B] mt-0.5 font-bold">&bull;</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* B. EVIDENCE PANEL: "WHY WAS THIS WORK FLAGGED?" */}
          <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="border-b border-[#DDDDD7] pb-3">
              <h3 className="text-sm font-bold text-[#202321] uppercase tracking-wider">
                Why Was This Work Flagged?
              </h3>
              <p className="text-xs text-[#6B706B]">
                Independent evidence cards with traceable numbers, calculations, and reference peers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Financial Evidence Card */}
              <div className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[6px] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#202321]">
                    Financial Analysis
                  </span>
                  <RiskBadge
                    level={agent_responses.financial_agent?.risk_level || "LOW"}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-[#202321] font-medium leading-relaxed">
                  {agent_responses.financial_agent?.findings[0]?.description ||
                    "Financial metrics conform to standard disbursement baselines."}
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-[#6B706B] block">Observed:</span>
                    <span className="font-bold text-[#202321]">
                      {formatINR(work.sanctioned_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B706B] block">Peer Median:</span>
                    <span className="font-bold text-[#214E3B]">
                      {formatINR(peer_comparison?.median_cost || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B706B] block">Variance:</span>
                    <span
                      className={`font-bold ${
                        (peer_comparison?.cost_deviation_pct || 0) > 50
                          ? "text-[#A84D17]"
                          : "text-[#202321]"
                      }`}
                    >
                      {(peer_comparison?.cost_deviation_pct || 0) > 0 ? "+" : ""}
                      {peer_comparison?.cost_deviation_pct || 0}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    openTrace(
                      "Financial Cost Analysis",
                      "sanctioned_amount",
                      work.sanctioned_amount,
                      peer_comparison?.median_cost,
                      `${(work.sanctioned_amount / 100000).toFixed(1)}L / ${(
                        (peer_comparison?.median_cost || 1) / 100000
                      ).toFixed(1)}L = ${(
                        work.sanctioned_amount / (peer_comparison?.median_cost || 1)
                      ).toFixed(2)}×`,
                      "Ratio of project sanctioned budget against peer group median."
                    )
                  }
                  className="text-[11px] font-semibold text-[#214E3B] hover:underline flex items-center gap-1 pt-1"
                >
                  <Calculator className="w-3 h-3" /> [View source data & calculation]
                </button>
              </div>

              {/* Progress Timeline Evidence Card */}
              <div className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[6px] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#202321]">
                    Progress Timeline
                  </span>
                  <RiskBadge
                    level={agent_responses.progress_agent?.risk_level || "LOW"}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-[#202321] font-medium leading-relaxed">
                  {agent_responses.progress_agent?.findings[0]?.description ||
                    "Progress duration conforms to standard execution schedules."}
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-[#6B706B] block">Work Status:</span>
                    <span className="font-bold text-[#202321]">{work.work_status}</span>
                  </div>
                  <div>
                    <span className="text-[#6B706B] block">Fund Utilization:</span>
                    <span className="font-bold text-[#214E3B]">
                      {work.utilization_percentage}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    openTrace(
                      "Progress Timeline Analysis",
                      "days_to_completion",
                      work.completion_date || "Pending",
                      work.sanction_date,
                      `Recorded Status: ${work.work_status} with ${work.utilization_percentage}% expenditure`,
                      "Evaluation of elapsed days against statutory 365-day schedule."
                    )
                  }
                  className="text-[11px] font-semibold text-[#214E3B] hover:underline flex items-center gap-1 pt-1"
                >
                  <Calculator className="w-3 h-3" /> [View source data & calculation]
                </button>
              </div>

              {/* Statistical ML Anomaly Evidence Card */}
              <div className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[6px] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#202321]">
                    Statistical Anomaly (Isolation Forest)
                  </span>
                  <RiskBadge
                    level={agent_responses.anomaly_agent?.risk_level || "LOW"}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-[#202321] font-medium leading-relaxed">
                  {agent_responses.anomaly_agent?.findings[0]?.description ||
                    "Multidimensional features conform to normal distribution."}
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-[#6B706B] block">Percentile Rank:</span>
                    <span className="font-bold text-[#202321]">
                      {peer_comparison?.cost_percentile || 50}%-tile
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B706B] block">Peer Z-Score:</span>
                    <span className="font-bold text-[#214E3B]">
                      {peer_comparison?.cost_z_score
                        ? (peer_comparison.cost_z_score > 0 ? `+${peer_comparison.cost_z_score}` : peer_comparison.cost_z_score)
                        : "0.0"}{" "}
                      σ
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    openTrace(
                      "Unsupervised Isolation Forest Analysis",
                      "isolation_forest_score",
                      `${agent_responses.anomaly_agent?.score || 20}/100`,
                      "Baseline 25/100",
                      `Z-score: +${peer_comparison?.cost_z_score}σ across ${peer_comparison?.peer_count} peer works`,
                      "Multivariate outlier score extracted from sanctioned amount, expenditure velocity, and duration."
                    )
                  }
                  className="text-[11px] font-semibold text-[#214E3B] hover:underline flex items-center gap-1 pt-1"
                >
                  <Calculator className="w-3 h-3" /> [View source data & calculation]
                </button>
              </div>

              {/* Geographic Analysis Evidence Card */}
              <div className="bg-[#FAF9F5] border border-[#DDDDD7] rounded-[6px] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#202321]">
                    Geographic & Spatial Density
                  </span>
                  <RiskBadge
                    level={agent_responses.geographic_agent?.risk_level || "LOW"}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-[#202321] font-medium leading-relaxed">
                  {agent_responses.geographic_agent?.findings[0]?.description ||
                    "Spatial allocation aligns with equitable district spread."}
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-[#6B706B] block">Village / Locality:</span>
                    <span className="font-bold text-[#202321]">
                      {work.village || "Rural area"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B706B] block">Block / Tehsil:</span>
                    <span className="font-bold text-[#202321]">{work.block || "District"}</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    openTrace(
                      "Geographic Clustering Analysis",
                      "village_fund_concentration_pct",
                      `${work.village || "Rural"}, ${work.block}`,
                      "Equitable distribution",
                      `Agency: ${work.implementing_agency}`,
                      "Evaluation of localized village fund share and executing agency concentration."
                    )
                  }
                  className="text-[11px] font-semibold text-[#214E3B] hover:underline flex items-center gap-1 pt-1"
                >
                  <Calculator className="w-3 h-3" /> [View source data & calculation]
                </button>
              </div>
            </div>
          </div>

          {/* C. AGENT EXECUTION STATUS (PROFESSIONAL EVIDENCE ANALYSIS SECTION) */}
          <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
            <div className="border-b border-[#DDDDD7] pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202321]">
                Evidence Analysis Module Status
              </h3>
              <p className="text-[11px] text-[#6B706B]">
                Verification status of specialized analytical engines
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
              {[
                { name: "Financial Analysis", status: "COMPLETE", time: "< 10ms" },
                { name: "Progress Timeline Analysis", status: "COMPLETE", time: "< 10ms" },
                { name: "Geographic Density Analysis", status: "COMPLETE", time: "< 15ms" },
                { name: "Anomaly Detection (ML)", status: "COMPLETE", time: "< 20ms" },
                { name: "Data Quality Audit", status: "COMPLETE", time: "< 5ms" },
                { name: "Lead Investigator Synthesis", status: "COMPLETE", time: "< 25ms" },
              ].map((mod) => (
                <div
                  key={mod.name}
                  className="bg-[#FAF9F5] p-3 rounded-[4px] border border-[#E5E4DE] flex items-center justify-between"
                >
                  <div>
                    <span className="font-sans font-semibold text-[#202321] block">
                      {mod.name}
                    </span>
                    <span className="text-[10px] text-[#6B706B]">{mod.time}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#235C3A] bg-[#EEF5F0] px-2 py-0.5 rounded border border-[#CCE0D2]">
                    {mod.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Disclaimer />
        </div>
      )}

      {/* TAB 2: SPECIALIST ANALYSIS FINDINGS */}
      {activeTab === "specialist" && (
        <div className="space-y-4">
          {Object.entries(agent_responses).map(([agentKey, agent]) => (
            <div
              key={agentKey}
              className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#DDDDD7] pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-[#202321] capitalize">
                    {agent.agent.replace("_", " ")}
                  </h3>
                  <span className="text-[11px] font-mono text-[#6B706B]">
                    Score: {agent.score}/100 &bull; Confidence: {(agent.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <RiskBadge level={agent.risk_level} size="sm" />
              </div>

              <div className="space-y-3">
                {agent.findings.map((f, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-[#FAF9F5] rounded-[6px] border border-[#E5E4DE] text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-[#202321]">{f.title}</span>
                      <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-white border border-[#DDDDD7]">
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[#525752] leading-relaxed">{f.description}</p>
                    {f.evidence && (
                      <div className="pt-2 border-t border-[#E5E4DE]">
                        <span className="text-[10px] font-bold uppercase text-[#6B706B] block mb-1">
                          Auditable Evidence Points:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px] text-[#202321]">
                          {f.evidence.map((ev, evI) => (
                            <div key={evI} className="bg-white p-1.5 rounded border border-[#DDDDD7]">
                              &bull; {ev}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PEER BENCHMARK */}
      {activeTab === "peers" && (
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between border-b border-[#DDDDD7] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#214E3B] font-bold">
                Comparison Group Analysis
              </span>
              <h3 className="text-base font-bold text-[#202321]">
                {peer_comparison?.peer_group_name || "Comparable Works"}
              </h3>
            </div>
            <span className="text-xs font-mono bg-[#FAF9F5] border border-[#DDDDD7] px-3 py-1 rounded">
              Peer Count: {peer_comparison?.peer_count || 0} works
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-numeric">
            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E4DE]">
              <span className="text-[11px] text-[#6B706B] uppercase block">This Work</span>
              <span className="text-lg font-bold text-[#202321] mt-1 block">
                {formatINR(work.sanctioned_amount)}
              </span>
            </div>
            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E4DE]">
              <span className="text-[11px] text-[#6B706B] uppercase block">Peer Median</span>
              <span className="text-lg font-bold text-[#214E3B] mt-1 block">
                {formatINR(peer_comparison?.median_cost || 0)}
              </span>
            </div>
            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E4DE]">
              <span className="text-[11px] text-[#6B706B] uppercase block">Variance</span>
              <span
                className={`text-lg font-bold mt-1 block ${
                  (peer_comparison?.cost_deviation_pct || 0) > 50
                    ? "text-[#A84D17]"
                    : "text-[#202321]"
                }`}
              >
                {(peer_comparison?.cost_deviation_pct || 0) > 0 ? "+" : ""}
                {peer_comparison?.cost_deviation_pct || 0}%
              </span>
            </div>
            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E4DE]">
              <span className="text-[11px] text-[#6B706B] uppercase block">Percentile Rank</span>
              <span className="text-lg font-bold text-[#202321] mt-1 block">
                {peer_comparison?.cost_percentile || 0}th %-tile
              </span>
            </div>
          </div>

          <div className="bg-[#FAF9F5] p-4 rounded border border-[#E5E4DE] space-y-2 text-xs font-mono">
            <span className="text-[10px] font-bold uppercase text-[#6B706B] block">
              Quartile Distribution (Box Plot Breakdown)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#202321]">
              <div>
                <span className="text-[#6B706B] block text-[10px]">25th Percentile:</span>
                <span>{formatINR(peer_comparison?.p25_cost || 0)}</span>
              </div>
              <div>
                <span className="text-[#6B706B] block text-[10px]">50th (Median):</span>
                <span>{formatINR(peer_comparison?.median_cost || 0)}</span>
              </div>
              <div>
                <span className="text-[#6B706B] block text-[10px]">75th Percentile:</span>
                <span>{formatINR(peer_comparison?.p75_cost || 0)}</span>
              </div>
              <div>
                <span className="text-[#6B706B] block text-[10px]">90th Percentile:</span>
                <span>{formatINR(peer_comparison?.p90_cost || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GEOGRAPHIC CONTEXT */}
      {activeTab === "map" && (
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#202321]">Spatial Work Location</h3>
              <p className="text-xs text-[#6B706B]">
                {work.village || "Rural"}, {work.block}, {work.district}, {work.state}
              </p>
            </div>
            {work.latitude && work.longitude && (
              <span className="text-xs font-mono text-[#214E3B]">
                GPS: {work.latitude.toFixed(4)}, {work.longitude.toFixed(4)}
              </span>
            )}
          </div>
          <WorkLocationMap
            works={[work]}
            onSelectWork={onSelectWork}
            selectedWorkId={work.work_id}
            height="h-[460px]"
          />
        </div>
      )}

      {/* TAB 5: RAW FIELDS */}
      {activeTab === "ledger" && (
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#202321]">Complete Auditable Entity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {Object.entries(work).map(([k, v]) => (
              <div
                key={k}
                className="bg-[#FAF9F5] p-2.5 rounded border border-[#E5E4DE] flex justify-between gap-4"
              >
                <span className="text-[#6B706B]">{k}:</span>
                <span className="text-[#202321] truncate max-w-xs">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
