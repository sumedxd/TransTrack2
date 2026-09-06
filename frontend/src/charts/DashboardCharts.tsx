import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { DashboardSummary } from "../types";
import { formatINR } from "../services/api";

interface Props {
  summary: DashboardSummary;
}

export const DashboardCharts: React.FC<Props> = ({ summary }) => {
  const riskData = summary.risk_distribution.map((r) => ({
    name: r.tier,
    count: r.count,
    color: r.color,
    action: r.action,
  }));

  const statusData = summary.status_distribution.map((s) => ({
    name: s.status,
    count: s.count,
    color: s.color,
  }));

  const districtData = summary.district_summary.slice(0, 6).map((d) => ({
    name: d.district,
    sanctioned: d.sanctioned / 10000000, // In Crores
    expenditure: d.expenditure / 10000000,
    count: d.works_count,
    highRisk: d.high_risk_count,
  }));

  const workTypeData = summary.work_type_summary.slice(0, 6).map((w) => ({
    name: w.work_type.length > 20 ? w.work_type.substring(0, 18) + "..." : w.work_type,
    fullName: w.work_type,
    count: w.count,
    sanctioned: w.sanctioned / 10000000,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
      {/* Risk Distribution Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Risk Tier Breakdown</h3>
            <p className="text-xs text-slate-400">Works categorized by multi-agent audit severity</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {summary.total_works}</span>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: "bold" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.375rem" }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} works (${item.payload.action})`,
                  "Count",
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Works by Status Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Execution Status Distribution</h3>
            <p className="text-xs text-slate-400">Physical progress stages across active MPLADS works</p>
          </div>
          <span className="text-xs font-mono text-sky-400">
            {summary.completed_works} Completed ({summary.total_works > 0 ? ((summary.completed_works/summary.total_works)*100).toFixed(0) : 0}%)
          </span>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.375rem" }}
                formatter={(val: any) => [`${val} works`, "Stage"]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Expenditure vs Sanctioned */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">District Financial Outlay (₹ Cr)</h3>
            <p className="text-xs text-slate-400">Sanctioned allocation vs cumulative vendor expenditure</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={districtData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-20} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: "₹ Cr", angle: -90, position: "insideLeft", fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.375rem" }}
                formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, ""]}
              />
              <Legend verticalAlign="top" height={36} formatter={(val) => <span className="text-xs text-slate-300 capitalize">{val}</span>} />
              <Bar dataKey="sanctioned" fill="#3b82f6" name="Sanctioned" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenditure" fill="#10b981" name="Expenditure" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Work Types Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Work Category Allocation</h3>
            <p className="text-xs text-slate-400">Number of sanctioned projects by developmental sector</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workTypeData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.375rem" }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} works (${formatINR(item.payload.sanctioned * 10000000)})`,
                  item.payload.fullName,
                ]}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Projects Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
