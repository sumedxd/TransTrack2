import React, { useState, useEffect } from "react";
import { BarChart3, RefreshCw, Download, PieChart as PieIcon, TrendingUp, DollarSign, Layers } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
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
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#F43F5E] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#64748B]">
          Compiling statistical distributions...
        </p>
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

  const workTypeData = summary.work_type_summary.slice(0, 7).map((w, idx) => ({
    name: w.work_type,
    count: w.count,
    sanctioned: w.sanctioned / 10000000,
    color: ["#625BE8", "#16B8A6", "#F5A20A", "#F43F5E", "#16A66A", "#8B5CF6", "#EC4899"][idx % 7],
  }));

  const riskData = [
    { name: "LOW", count: summary.low_risk_count, color: "#16A66A" },
    { name: "MEDIUM", count: summary.medium_risk_count, color: "#F5C542" },
    { name: "HIGH", count: summary.high_risk_count, color: "#F5A20A" },
    { name: "CRITICAL", count: summary.critical_risk_count, color: "#F43F5E" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F43F5E] bg-[#FFF1F2] px-2.5 py-0.5 rounded-md border border-[#FECDD3]">
              Empirical Analytics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1">
            Statistical Audit Analytics & Distributions
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Empirical expenditure patterns, category allocations, and risk variances across districts
          </p>
        </div>
      </div>

      {/* 2 Top Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* District Financial Outlays */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#1E293B]">
                District Sanctioned vs. Disbursed Expenditure
              </h3>
              <p className="text-xs text-[#64748B]">
                Comparison of administrative sanctions against actual vendor payment releases (₹ Cr)
              </p>
            </div>
            <span className="text-xs font-bold text-[#625BE8]">Top 8 Districts</span>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11, fill: "#475569" }} angle={-20} textAnchor="end" />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} label={{ value: "₹ Cr", angle: -90, position: "insideLeft", fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", fontSize: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)} Cr`, ""]}
                />
                <Legend verticalAlign="top" height={36} formatter={(val) => <span className="text-xs text-[#1E293B] font-bold">{val}</span>} />
                <Bar dataKey="sanctioned" fill="#625BE8" name="Sanctioned Outlay" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenditure" fill="#16B8A6" name="Disbursed Expenditure" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="border-b border-[#F1F5F9] pb-3">
            <h3 className="text-base font-extrabold text-[#1E293B]">
              Risk Portfolio Breakdown
            </h3>
            <p className="text-xs text-[#64748B]">
              Share of projects across risk classifications
            </p>
          </div>

          <div className="h-56 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} works`, `${name} Risk`]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {riskData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-[#1E293B]">{item.name} RISK</span>
                </div>
                <span className="font-mono font-extrabold text-[#334155]">{item.count} works</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Allocations */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="border-b border-[#F1F5F9] pb-3">
          <h3 className="text-base font-extrabold text-[#1E293B]">
            Developmental Sector Project Volume & Outlays
          </h3>
          <p className="text-xs text-[#64748B]">
            Distribution of public works by sector type (Community, Roads, Drinking Water, Health, Sanitation)
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workTypeData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="#94A3B8" tick={{ fontSize: 11, fill: "#1E293B", fontWeight: 600 }} width={160} />
              <Tooltip
                contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", fontSize: "12px" }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} works (${formatINR(item.payload.sanctioned * 10000000)})`,
                  item.payload.name,
                ]}
              />
              <Bar dataKey="count" fill="#F5A20A" radius={[0, 8, 8, 0]} name="Project Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
