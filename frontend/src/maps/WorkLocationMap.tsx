import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { Work } from "../types";
import { RiskBadge } from "../components/RiskBadge";
import { formatINR } from "../services/api";
import { ExternalLink } from "lucide-react";

interface Props {
  works: Work[];
  onSelectWork: (workId: string) => void;
  selectedWorkId?: string;
  height?: string;
  onBoundsChange?: (visibleWorks: Work[]) => void;
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
  height = "h-96",
}) => {
  const validWorks = works.filter(
    (w) => w.latitude && w.longitude && !isNaN(w.latitude) && !isNaN(w.longitude)
  );

  const selectedWork = validWorks.find((w) => w.work_id === selectedWorkId);
  const center: [number, number] = selectedWork
    ? [selectedWork.latitude!, selectedWork.longitude!]
    : [20.5937, 78.9629]; // India geographic center
  const zoom = selectedWork ? 11 : 5;

  const getColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return "#992222"; // Muted Red
      case "HIGH":
        return "#A84D17"; // Muted Orange
      case "MEDIUM":
        return "#8A5B00"; // Muted Amber
      case "LOW":
        return "#235C3A"; // Muted Green
      default:
        return "#525752";
    }
  };

  return (
    <div className={`w-full ${height} rounded-[8px] overflow-hidden border border-[#DDDDD7] relative shadow-xs`}>
      {/* Legend overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-[2px] border border-[#DDDDD7] rounded-[6px] px-3 py-1.5 text-[11px] font-sans flex items-center gap-3 shadow-xs">
        <span className="flex items-center gap-1.5 text-[#202321]">
          <span className="w-2 h-2 rounded-full bg-[#992222]"></span> Critical
        </span>
        <span className="flex items-center gap-1.5 text-[#202321]">
          <span className="w-2 h-2 rounded-full bg-[#A84D17]"></span> High
        </span>
        <span className="flex items-center gap-1.5 text-[#202321]">
          <span className="w-2 h-2 rounded-full bg-[#8A5B00]"></span> Medium
        </span>
        <span className="flex items-center gap-1.5 text-[#202321]">
          <span className="w-2 h-2 rounded-full bg-[#235C3A]"></span> Low
        </span>
        <span className="text-[#6B706B] border-l border-[#DDDDD7] pl-2 font-mono">
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
              radius={isSelected ? 9 : work.risk_level === "CRITICAL" ? 7 : 5}
              pathOptions={{
                color: isSelected ? "#202321" : markerColor,
                fillColor: markerColor,
                fillOpacity: 0.85,
                weight: isSelected ? 2.5 : 1,
              }}
            >
              <Popup>
                <div className="text-xs p-1 max-w-xs font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-[#E5E4DE] pb-1.5 mb-1.5">
                    <span className="font-mono font-bold text-[#214E3B]">{work.work_id}</span>
                    <RiskBadge level={work.risk_level} size="sm" />
                  </div>
                  <p className="font-medium text-[#202321] line-clamp-2 mb-1.5">
                    {work.work_description}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[#525752] mb-2 font-numeric">
                    <div>
                      <span className="text-[#6B706B]">Sanctioned:</span> {formatINR(work.sanctioned_amount)}
                    </div>
                    <div>
                      <span className="text-[#6B706B]">Status:</span> {work.work_status}
                    </div>
                    <div>
                      <span className="text-[#6B706B]">District:</span> {work.district}
                    </div>
                    <div>
                      <span className="text-[#6B706B]">Priority:</span> {work.risk_score}/100
                    </div>
                  </div>
                  {work.top_finding && (
                    <div className="bg-[#FAF9F5] p-1.5 rounded border border-[#E5E4DE] text-[10px] text-[#525752] mb-2">
                      <strong className="block text-[#6B706B]">Key Indicator:</strong>
                      {work.top_finding}
                    </div>
                  )}
                  <button
                    onClick={() => onSelectWork(work.work_id)}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#214E3B] hover:bg-[#173729] text-white py-1 px-2 rounded-[4px] text-[11px] font-medium transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Investigation Dossier
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
