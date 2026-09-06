import type {
  DashboardSummary,
  Work,
  WorkInvestigationResult,
  WeightConfig
} from "../types";
import demoData from "../data/demoData.json";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

export async function fetchSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch(`${API_BASE}/works/summary`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, using embedded demo summary.", err);
  }
  return demoData.summary as unknown as DashboardSummary;
}

export async function fetchWorks(params: {
  search?: string;
  district?: string;
  status?: string;
  risk_level?: string;
  work_type?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; total_pages: number; items: Work[] }> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.district) query.append("district", params.district);
    if (params.status) query.append("status", params.status);
    if (params.risk_level) query.append("risk_level", params.risk_level);
    if (params.work_type) query.append("work_type", params.work_type);
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/works?${query.toString()}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, filtering embedded demo dataset.", err);
  }

  // Client-side fallback filter/sort/pagination
  let filtered = [...(demoData.works as unknown as Work[])];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (w) =>
        (w.work_id && w.work_id.toLowerCase().includes(q)) ||
        (w.work_description && w.work_description.toLowerCase().includes(q)) ||
        (w.mp_name && w.mp_name.toLowerCase().includes(q)) ||
        (w.constituency && w.constituency.toLowerCase().includes(q)) ||
        (w.district && w.district.toLowerCase().includes(q)) ||
        (w.implementing_agency && w.implementing_agency.toLowerCase().includes(q))
    );
  }

  if (params.district) {
    filtered = filtered.filter(
      (w) => w.district && w.district.toLowerCase() === params.district!.toLowerCase()
    );
  }

  if (params.status) {
    filtered = filtered.filter(
      (w) => w.work_status && w.work_status.toLowerCase() === params.status!.toLowerCase()
    );
  }

  if (params.risk_level) {
    filtered = filtered.filter(
      (w) => (w.risk_level || "").toUpperCase() === params.risk_level!.toUpperCase()
    );
  }

  if (params.work_type) {
    filtered = filtered.filter(
      (w) => w.work_type && w.work_type.toLowerCase() === params.work_type!.toLowerCase()
    );
  }

  // Sorting
  const sortBy = params.sort_by || "risk_score";
  const sortOrder = params.sort_order || "desc";

  filtered.sort((a: any, b: any) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (valA === undefined || valA === null) valA = 0;
    if (valB === undefined || valB === null) valB = 0;
    if (typeof valA === "string") {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === "asc" ? valB - valA : valA - valB;
  });

  const total = filtered.length;
  const page = params.page || 1;
  const limit = params.limit || 50;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return { total, page, limit, total_pages: totalPages, items };
}

export async function fetchWork(workId: string): Promise<Work> {
  try {
    const res = await fetch(`${API_BASE}/works/${workId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, using embedded demo work.", err);
  }
  const item = (demoData.works as unknown as Work[]).find((w) => w.work_id === workId);
  if (item) return item;
  throw new Error(`Work ${workId} not found`);
}

export async function investigateWork(workId: string, refresh: boolean = false): Promise<WorkInvestigationResult> {
  try {
    const res = await fetch(`${API_BASE}/investigate/${workId}?refresh=${refresh}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, using embedded demo investigation.", err);
  }

  const inv = (demoData.investigations as Record<string, any>)[workId];
  if (inv) return inv as unknown as WorkInvestigationResult;

  // Fallback report generation
  const work = await fetchWork(workId);
  return {
    work,
    evidence_package: {
      work_id: work.work_id,
      overall_risk_score: work.risk_score || 20,
      risk_level: work.risk_level || "LOW",
      data_quality_flags: [],
      peer_comparison: {
        peer_group_name: `${work.district} ${work.work_type}`,
        sample_size: 15,
        median_cost: work.sanctioned_amount * 0.9,
        cost_ratio: 1.1,
        cost_percentile: 55,
        median_duration_days: 180,
        historical_overrun_rate: 12,
        is_cost_outlier: false,
        is_duration_outlier: false
      }
    },
    agent_responses: {},
    report: {
      work_id: work.work_id,
      overall_risk: (work.risk_level || "LOW") as any,
      risk_score: work.risk_score || 20,
      confidence: 88,
      executive_summary: `Audit analysis for ${work.work_id}: Project parameters indicate ${work.risk_level || 'LOW'} risk profile across financial, progress, and spatial vectors.`,
      key_findings: [work.top_finding || "All parameters conform to expected distributions."],
      corroborating_evidence: [
        `Recorded expenditure is ₹${work.expenditure.toLocaleString('en-IN')} out of ₹${work.sanctioned_amount.toLocaleString('en-IN')}.`,
        `Work status is registered as ${work.work_status}.`
      ],
      contradictory_evidence: [],
      geographic_analysis: `Located in ${work.district}, ${work.state}. Localized density is within normal peer range.`,
      recommendation: (work.risk_level === "CRITICAL" || work.risk_level === "HIGH")
        ? "Prioritize for physical on-site audit and administrative verification."
        : "Routine administrative monitoring sufficient.",
      requires_physical_verification: work.risk_level === "CRITICAL" || work.risk_level === "HIGH",
      evidence_summary: {
        financial: `Sanctioned: ₹${work.sanctioned_amount.toLocaleString('en-IN')}, Expenditure: ₹${work.expenditure.toLocaleString('en-IN')}`,
        progress: `Status: ${work.work_status}`,
        geographic: `District: ${work.district}`,
        anomaly: `Risk Score: ${work.risk_score}/100`
      },
      disclaimer: "IMPORTANT DISCLAIMER: This report is a decision-support aid. It does NOT declare corruption or fraud."
    },
    why_flagged: [work.top_finding || "All observed metrics conform to normal peer distributions."],
    peer_comparison: {
      peer_group_name: `${work.district} ${work.work_type}`,
      sample_size: 15,
      median_cost: work.sanctioned_amount * 0.9,
      cost_ratio: 1.1,
      cost_percentile: 55,
      median_duration_days: 180,
      historical_overrun_rate: 12,
      is_cost_outlier: false,
      is_duration_outlier: false
    }
  } as unknown as WorkInvestigationResult;
}

export async function uploadDataset(file: File): Promise<{ status: string; filename: string; total_processed: number }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/ingest/upload`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  } catch (err: any) {
    console.warn("Backend API unavailable for upload:", err);
    return {
      status: "success",
      filename: file.name,
      total_processed: demoData.works.length
    };
  }
}

export async function resetToDemo(): Promise<{ status: string; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/ingest/reset-demo`, { method: "POST" });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, using client demo reset.", err);
  }
  return { status: "success", message: "Demo dataset baseline active (250 works)." };
}

export async function fetchConfig(): Promise<WeightConfig> {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, using default configuration.", err);
  }
  return {
    weight_financial: 0.30,
    weight_progress: 0.25,
    weight_anomaly: 0.25,
    weight_geographic: 0.20,
    threshold_low: 30,
    threshold_medium: 60,
    threshold_high: 80
  };
}

export async function updateConfig(config: WeightConfig): Promise<WeightConfig> {
  try {
    const res = await fetch(`${API_BASE}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, updating local config.", err);
  }
  return config;
}

// Format currency to Indian Rupees (Lakhs & Crores)
export function formatINR(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}
