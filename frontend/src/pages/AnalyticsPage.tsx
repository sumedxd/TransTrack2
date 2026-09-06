import React, { useState, useEffect } from "react";
import { BarChart3, RefreshCw, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardSummary } from "../types";
import { fetchSummary, formatINR } from "../services/api";

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await fetchSummary();
        setSummary(s);
      } catch (e) {
        console.error("Failed to load analytics summary", e);
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

  if (!summary) return null;

  const districtData = summary.district_summary.slice(0, 8).map((d) => ({
    name: d.district,
    sanctioned: d.sanctioned / 10000000,
    expenditure: d.expenditure / 10000000,
    highRisk: d.high_risk_count,
  }));

  const workTypeData = summary.work_type_summary.slice(0, 7).map((w) => ({
    name: w.work_type,
    count: w.count,
    sanctioned: w.sanctioned / 10000000,
  }));

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-[#DDDDD7] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#202321] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#214E3B]" />
            Statistical Audit Analytics & Distributions
          </h2>
          <p className="text-xs text-[#6B706B]">
            Empirical expenditure patterns, category allocations, and risk variances across districts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Financial Outlays */}
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="border-b border-[#E5E4DE] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202321]">
              District Sanctioned vs. Actual Expenditure (₹ Crore)
            </h3>
            <p className="text-[11px] text-[#6B706B]">
              Comparison of administrative approvals against verified vendor payment releases
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#6B706B" tick={{ fontSize: 10, fill: "#202321" }} angle={-20} textAnchor="end" />
                <YAxis stroke="#6B706B" tick={{ fontSize: 10 }} label={{ value: "₹ Cr", angle: -90, position: "insideLeft", fill: "#6B706B" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#DDDDD7", borderRadius: "6px", fontSize: "11px" }}
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, ""]}
                />
                <Legend verticalAlign="top" height={36} formatter={(val) => <span className="text-xs text-[#202321] font-medium">{val}</span>} />
                <Bar dataKey="sanctioned" fill="#214E3B" name="Sanctioned Outlay" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenditure" fill="#68785B" name="Disbursed Expenditure" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work Categories Allocation */}
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="border-b border-[#E5E4DE] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202321]">
              Developmental Sector Project Volume
            </h3>
            <p className="text-[11px] text-[#6B706B]">
              Number of works sanctioned by developmental category
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workTypeData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#6B706B" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#6B706B" tick={{ fontSize: 10, fill: "#202321" }} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#DDDDD7", borderRadius: "6px", fontSize: "11px" }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} works (${formatINR(item.payload.sanctioned * 10000000)})`,
                    item.payload.name,
                  ]}
                />
                <Bar dataKey="count" fill="#3D453E" radius={[0, 2, 2, 0]} name="Project Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
