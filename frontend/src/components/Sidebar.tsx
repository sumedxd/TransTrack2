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
  ShieldCheck,
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
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "works", label: "Works", icon: FileSpreadsheet },
    {
      id: "investigations",
      label: "Investigations",
      icon: SearchCode,
      badge: priorityCount > 0 ? priorityCount : undefined,
      badgeColor: "bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]",
    },
    { id: "map", label: "Map", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    {
      id: "data-quality",
      label: "Data Quality",
      icon: CheckCircle2,
      badge: qualityIssueCount > 0 ? qualityIssueCount : undefined,
      badgeColor: "bg-[#FEFCE8] text-[#CA8A04] border-[#FEF08A]",
    },
  ];

  const secondaryNav = [
    { id: "ingest", label: "Data Ingestion", icon: Database },
    { id: "methodology", label: "Settings", icon: Sliders },
  ];

  return (
    <aside className="w-60 bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)] select-none">
      <div className="p-4 space-y-6">
        {/* Main Section */}
        <div>
          <div className="px-3 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Navigation
            </span>
          </div>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id as NavItem)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#16A66A] text-white shadow-xs"
                      : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-[#64748B]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        isActive
                          ? "bg-white text-[#16A66A] border-white"
                          : item.badgeColor
                      }`}
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
          <div className="px-3 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Administration
            </span>
          </div>
          <nav className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id as NavItem)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#16A66A] text-white shadow-xs"
                      : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-[#64748B]"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Multi-Agent Engine Status */}
      <div className="p-4 border-t border-[#E2E8F0] m-3 bg-[#F8FAFC] rounded-2xl text-xs text-[#64748B] space-y-1.5">
        <div className="flex items-center gap-2 text-[#1E293B] font-bold">
          <ShieldCheck className="w-4 h-4 text-[#16A66A]" />
          <span>Active Audit System</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>Specialist Agents:</span>
          <span className="font-semibold text-[#16A66A]">5 Online</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>ML Outlier Engine:</span>
          <span className="font-semibold text-[#625BE8]">Isolation Forest</span>
        </div>
      </div>
    </aside>
  );
};
