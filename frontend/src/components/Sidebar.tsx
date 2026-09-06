import React from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  SearchCode,
  MapPin,
  BarChart3,
  CheckCircle2,
  Database,
  Sliders,
} from "lucide-react";

export type NavItem =
  | "overview"
  | "works"
  | "investigations"
  | "map"
  | "analytics"
  | "data-quality"
  | "ingest"
  | "methodology";

interface Props {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
  priorityCount?: number;
  qualityIssueCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeItem,
  onSelect,
  priorityCount = 0,
  qualityIssueCount = 0,
}) => {
  const mainNav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "works", label: "Works Register", icon: FileSpreadsheet },
    {
      id: "investigations",
      label: "Investigations",
      icon: SearchCode,
      badge: priorityCount > 0 ? priorityCount : undefined,
      badgeColor: "bg-[#FDF4EE] text-[#A84D17] border-[#F4CFB7]",
    },
    { id: "map", label: "Spatial Map", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    {
      id: "data-quality",
      label: "Data Quality",
      icon: CheckCircle2,
      badge: qualityIssueCount > 0 ? qualityIssueCount : undefined,
      badgeColor: "bg-[#FDF8EE] text-[#8A5B00] border-[#EEDAA2]",
    },
  ];

  const secondaryNav = [
    { id: "ingest", label: "Data Ingestion", icon: Database },
    { id: "methodology", label: "Methodology", icon: Sliders },
  ];

  return (
    <aside className="w-56 bg-white border-r border-[#DDDDD7] flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)] select-none">
      <div className="p-3 space-y-6">
        {/* Main Section */}
        <div>
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B706B]">
              Monitoring
            </span>
          </div>
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id as NavItem)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium transition ${
                    isActive
                      ? "bg-[#EEF5F0] text-[#214E3B] font-semibold"
                      : "text-[#525752] hover:bg-[#F6F5F1] hover:text-[#202321]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#214E3B]" : "text-[#6B706B]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-[4px] text-[10px] font-mono font-bold border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administration Section */}
        <div>
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B706B]">
              Administration
            </span>
          </div>
          <nav className="space-y-0.5">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id as NavItem)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition ${
                    isActive
                      ? "bg-[#EEF5F0] text-[#214E3B] font-semibold"
                      : "text-[#525752] hover:bg-[#F6F5F1] hover:text-[#202321]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#214E3B]" : "text-[#6B706B]"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info in Sidebar */}
      <div className="p-3 border-t border-[#DDDDD7] text-[11px] text-[#6B706B] font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine:</span>
          <span className="text-[#202321] font-semibold">Multi-Agent v2.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Isolation Forest:</span>
          <span className="text-[#214E3B] font-semibold">Fitted (n=100)</span>
        </div>
      </div>
    </aside>
  );
};
