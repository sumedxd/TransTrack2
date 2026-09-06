import React, { useState, useEffect } from "react";
import { MapPin, ExternalLink, RefreshCw, Filter } from "lucide-react";
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
    <div className="space-y-4 pb-12">
      <div className="border-b border-[#DDDDD7] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#202321] tracking-tight flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#214E3B]" />
            Spatial Distribution & Geographic Audit
          </h2>
          <p className="text-xs text-[#6B706B]">
            Interactive geospatial mapping of MPLADS assets across parliamentary constituencies
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-white border border-[#DDDDD7] rounded-[5px] px-2.5 py-1 text-xs text-[#202321] focus:outline-none focus:border-[#214E3B]"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Canvas (3 columns) */}
        <div className="lg:col-span-3">
          <WorkLocationMap
            works={works}
            onSelectWork={onSelectWork}
            selectedWorkId={selectedWorkId}
            height="h-[620px]"
          />
        </div>

        {/* Side Panel: "WORKS IN VIEW" (1 column) */}
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-4 flex flex-col h-[620px] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="border-b border-[#E5E4DE] pb-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#214E3B] font-bold">
              Spatial Registry
            </span>
            <h3 className="text-sm font-bold text-[#202321]">WORKS IN VIEW</h3>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-center text-xs pt-1">
              <div className="bg-[#FAF9F5] p-2 rounded border border-[#E5E4DE]">
                <span className="text-[10px] text-[#6B706B] block">TOTAL</span>
                <span className="font-bold text-sm text-[#202321]">{works.length}</span>
              </div>
              <div className="bg-[#FDF4EE] p-2 rounded border border-[#F4CFB7]">
                <span className="text-[10px] text-[#A84D17] block">HIGH</span>
                <span className="font-bold text-sm text-[#A84D17]">{highRiskCount}</span>
              </div>
              <div className="bg-[#FCEEEE] p-2 rounded border border-[#F3C1C1]">
                <span className="text-[10px] text-[#992222] block">CRITICAL</span>
                <span className="font-bold text-sm text-[#992222]">{criticalCount}</span>
              </div>
            </div>
          </div>

          {/* List of works in view */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EFEFEA] my-2 pr-1">
            {works.slice(0, 30).map((w) => (
              <div
                key={w.work_id}
                onClick={() => setSelectedWorkId(w.work_id)}
                className={`py-2 px-2 rounded cursor-pointer transition text-xs ${
                  selectedWorkId === w.work_id
                    ? "bg-[#FAF9F5] border border-[#DDDDD7]"
                    : "hover:bg-[#F6F5F1]"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono font-bold text-[#214E3B] text-[11px]">
                    {w.work_id}
                  </span>
                  <RiskBadge level={w.risk_level} size="sm" />
                </div>
                <p className="text-[11px] text-[#202321] truncate font-medium">
                  {w.work_description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#6B706B] mt-1 font-numeric">
                  <span>{w.district}</span>
                  <span>{formatINR(w.sanctioned_amount)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#E5E4DE]">
            <span className="text-[10px] text-[#6B706B] block text-center">
              Click marker on map to open investigation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
