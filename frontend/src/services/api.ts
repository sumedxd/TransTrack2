import type {
  DashboardSummary,
  Work,
  WorkInvestigationResult,
  WeightConfig
} from "../types";

const API_BASE = "/api";

export async function fetchSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/works/summary`);
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to fetch works list");
  return res.json();
}

export async function fetchWork(workId: string): Promise<Work> {
  const res = await fetch(`${API_BASE}/works/${workId}`);
  if (!res.ok) throw new Error(`Failed to fetch work ${workId}`);
  return res.json();
}

export async function investigateWork(workId: string, refresh: boolean = false): Promise<WorkInvestigationResult> {
  const res = await fetch(`${API_BASE}/investigate/${workId}?refresh=${refresh}`);
  if (!res.ok) throw new Error(`Failed to investigate work ${workId}`);
  return res.json();
}

export async function uploadDataset(file: File): Promise<{ status: string; filename: string; total_processed: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/ingest/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function resetToDemo(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/ingest/reset-demo`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset to demo dataset");
  return res.json();
}

export async function fetchConfig(): Promise<WeightConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

export async function updateConfig(config: WeightConfig): Promise<WeightConfig> {
  const res = await fetch(`${API_BASE}/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update config");
  }
  return res.json();
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
