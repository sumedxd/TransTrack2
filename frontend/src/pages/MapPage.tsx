import React, { useState, useEffect } from "react";
import { MapPin, ExternalLink, RefreshCw, Filter, Layers, Navigation, ArrowRight } from "lucide-react";
import type { Work } from "../types";
import { fetchWorks, formatINR } from "../services/api";
import { WorkLocationMap } from "../maps/WorkLocationMap";
import { RiskBadge } from "../components/RiskBadge";

interface Props {
  onSelectWork: (workId: string) => void;
}

export const MapPage: React.FC<Props> = ({ onSelectWork }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWorkId, setSelectedWorkId] = useState<string | undefined>();
  const [riskFilter, setRiskFilter] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWorks({ limit: 300, risk_level: riskFilter || undefined });
        setWorks(res.items);
      } catch (e) {
        console.error("Failed to load map works", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [riskFilter]);

  const highRiskCount = works.filter((w) => w.risk_level === "HIGH").length;
  const criticalCount = works.filter((w) => w.risk_level === "CRITICAL").length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F5A20A] bg-[#FFF7ED] px-2.5 py-0.5 rounded-md border border-[#FFEDD5]">
              Spatial Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1 flex items-center gap-2">
            Geographic Risk Map
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Geospatial density and cluster analysis across constituencies
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#F5A20A] cursor-pointer shadow-2xs"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Canvas (8 columns) */}
        <div className="lg:col-span-8">
          <WorkLocationMap
            works={works}
            onSelectWork={onSelectWork}
            selectedWorkId={selectedWorkId}
            height="h-[620px]"
          />
        </div>

        {/* Side Panel: "WORKS IN VIEW" (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 flex flex-col h-[620px] shadow-xs justify-between">
          <div className="border-b border-[#E2E8F0] pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Spatial Registry
              </span>
              <span className="text-xs font-bold text-[#625BE8]">{works.length} Geo-tagged</span>
            </div>
            <h3 className="text-base font-extrabold text-[#1E293B]">WORKS IN VIEW</h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-[#F8FAFC] p-2.5 rounded-2xl border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] font-bold uppercase block">TOTAL</span>
                <span className="font-extrabold text-sm text-[#1E293B] mt-0.5 block">{works.length}</span>
              </div>
              <div className="bg-[#FFF7ED] p-2.5 rounded-2xl border border-[#FFEDD5]">
                <span className="text-[10px] text-[#EA580C] font-bold uppercase block">HIGH</span>
                <span className="font-extrabold text-sm text-[#EA580C] mt-0.5 block">{highRiskCount}</span>
              </div>
              <div className="bg-[#FFF1F2] p-2.5 rounded-2xl border border-[#FECDD3]">
                <span className="text-[10px] text-[#E11D48] font-bold uppercase block">CRITICAL</span>
                <span className="font-extrabold text-sm text-[#E11D48] mt-0.5 block">{criticalCount}</span>
              </div>
            </div>
          </div>

          {/* List of works in view */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] my-2 pr-1 space-y-1">
            {works.slice(0, 35).map((w) => (
              <div
                key={w.work_id}
                onClick={() => setSelectedWorkId(w.work_id)}
                className={`py-2.5 px-3 rounded-2xl cursor-pointer transition text-xs ${
                  selectedWorkId === w.work_id
                    ? "bg-[#EEF2FF] border border-[#C7D2FE]"
                    : "hover:bg-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-[#625BE8] text-xs">
                    {w.work_id}
                  </span>
                  <RiskBadge level={w.risk_level} size="sm" />
                </div>
                <p className="text-xs text-[#1E293B] truncate font-semibold">
                  {w.work_description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-1.5 font-mono">
                  <span>{w.district}</span>
                  <span className="font-bold text-[#1E293B]">{formatINR(w.sanctioned_amount)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] text-center">
            <span className="text-[11px] text-[#94A3B8] font-medium block">
              Click any work to focus or click marker for dossier
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
