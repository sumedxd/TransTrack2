import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { Work } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { formatINR } from "../services/api";
import { ArrowRight, SearchCode, MapPin } from "lucide-react";

interface Props {
  works: Work[];
  onSelectWork: (workId: string) => void;
  selectedWorkId?: string;
  height?: string;
}

const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const WorkLocationMap: React.FC<Props> = ({
  works,
  onSelectWork,
  selectedWorkId,
  height = "h-[560px]",
}) => {
  const validWorks = works.filter(
    (w) => w.latitude && w.longitude && !isNaN(w.latitude) && !isNaN(w.longitude)
  );

  const selectedWork = validWorks.find((w) => w.work_id === selectedWorkId);
  const center: [number, number] = selectedWork
    ? [selectedWork.latitude!, selectedWork.longitude!]
    : [20.5937, 78.9629];
  const zoom = selectedWork ? 12 : 5;

  const getColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return "#F43F5E"; // Bright Rose Red
      case "HIGH":
        return "#F5A20A"; // Vivid Amber Orange
      case "MEDIUM":
        return "#F5C542"; // Bright Yellow
      case "LOW":
        return "#16A66A"; // Bright Emerald Green
      default:
        return "#64748B";
    }
  };

  return (
    <div className={`w-full ${height} rounded-3xl overflow-hidden border border-[#E2E8F0] relative shadow-xs`}>
      {/* Interactive Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl px-4 py-2 text-xs font-semibold flex items-center gap-3.5 shadow-md">
        <span className="flex items-center gap-1.5 text-[#1E293B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" /> Critical
        </span>
        <span className="flex items-center gap-1.5 text-[#1E293B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F5A20A]" /> High
        </span>
        <span className="flex items-center gap-1.5 text-[#1E293B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F5C542]" /> Medium
        </span>
        <span className="flex items-center gap-1.5 text-[#1E293B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A66A]" /> Low
        </span>
        <span className="text-[#64748B] border-l border-[#E2E8F0] pl-2 font-mono font-bold">
          {validWorks.length} Geo-tagged
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapRecenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validWorks.map((work) => {
          const isSelected = work.work_id === selectedWorkId;
          const markerColor = getColor(work.risk_level);

          return (
            <CircleMarker
              key={work.work_id}
              center={[work.latitude!, work.longitude!]}
              radius={isSelected ? 10 : work.risk_level === "CRITICAL" ? 8 : 6}
              pathOptions={{
                color: isSelected ? "#0F172A" : "#FFFFFF",
                fillColor: markerColor,
                fillOpacity: 0.9,
                weight: isSelected ? 3 : 1.5,
              }}
            >
              <Popup>
                <div className="text-xs p-2 max-w-xs font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2 mb-2">
                    <span className="font-mono font-extrabold text-[#625BE8]">{work.work_id}</span>
                    <RiskBadge level={work.risk_level} size="sm" />
                  </div>
                  <p className="font-bold text-[#1E293B] line-clamp-2 mb-2">
                    {work.work_description}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[#475569] mb-3">
                    <div>
                      <span className="text-[#94A3B8]">Sanctioned:</span>{" "}
                      <strong className="text-[#1E293B]">{formatINR(work.sanctioned_amount)}</strong>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Status:</span> {work.work_status}
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">District:</span> {work.district}
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Score:</span>{" "}
                      <strong className="text-[#E11D48]">{work.risk_score?.toFixed(0)}/100</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectWork(work.work_id)}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#16A66A] hover:bg-[#138A58] text-white py-2 px-3 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>Investigate Work</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
