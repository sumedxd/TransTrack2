export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Finding {
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  severity: Severity;
  metric?: string;
  observed_value?: any;
  expected_value?: any;
}

export interface AgentResponse {
  agent: string;
  risk_level: RiskLevel;
  score: number;
  confidence: number;
  findings: Finding[];
}

export interface DataQualityFlag {
  field: string;
  issue_type: string;
  severity: Severity;
  message: string;
  value?: any;
}

export interface PeerStats {
  peer_group_name: string;
  peer_count: number;
  median_cost: number;
  mean_cost: number;
  p25_cost: number;
  p75_cost: number;
  p90_cost: number;
  median_duration?: number;
  cost_deviation_pct: number;
  cost_z_score: number;
  cost_percentile: number;
}

export interface EvidencePackage {
  work_id: string;
  financial_findings: Finding[];
  progress_findings: Finding[];
  geographic_findings: Finding[];
  anomaly_findings: Finding[];
  data_quality_flags: DataQualityFlag[];
  peer_stats?: PeerStats;
}

export interface LeadInvestigatorReport {
  work_id: string;
  overall_risk: RiskLevel;
  risk_score: number;
  confidence: number;
  executive_summary: string;
  key_findings: string[];
  corroborating_evidence: string[];
  contradictory_evidence: string[];
  geographic_analysis: string;
  recommendation: string;
  requires_physical_verification: boolean;
  evidence_summary: Record<string, string>;
  disclaimer: string;
}

export interface Work {
  id: number;
  work_id: string;
  mp_name: string;
  mp_house: string;
  constituency: string;
  state: string;
  district: string;
  block?: string;
  village?: string;
  implementing_agency: string;
  work_type: string;
  work_description: string;
  sanctioned_amount: number;
  released_amount: number;
  expenditure: number;
  balance_amount: number;
  work_status: string;
  recommendation_date?: string;
  sanction_date?: string;
  completion_date?: string;
  financial_year: string;
  latitude?: number;
  longitude?: number;
  is_demo: boolean;
  risk_score: number;
  risk_level: RiskLevel;
  top_finding?: string;
  utilization_percentage: number;
}

export interface WorkInvestigationResult {
  work: Work;
  evidence_package: EvidencePackage;
  agent_responses: Record<string, AgentResponse>;
  report: LeadInvestigatorReport;
  why_flagged: string[];
  peer_comparison?: PeerStats;
}

export interface DashboardSummary {
  total_works: number;
  total_sanctioned: number;
  total_expenditure: number;
  overall_utilization: number;
  completed_works: number;
  in_progress_works: number;
  sanctioned_works: number;
  stalled_works: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  risk_distribution: Array<{ tier: string; count: number; color: string; action: string }>;
  status_distribution: Array<{ status: string; count: number; color: string }>;
  district_summary: Array<{ district: string; state: string; works_count: number; sanctioned: number; expenditure: number; high_risk_count: number }>;
  work_type_summary: Array<{ work_type: string; count: number; sanctioned: number; expenditure: number }>;
}

export interface WeightConfig {
  weight_financial: number;
  weight_progress: number;
  weight_anomaly: number;
  weight_geographic: number;
  threshold_low: number;
  threshold_medium: number;
  threshold_high: number;
}
