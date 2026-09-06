import React from "react";
import { Shield, LayoutDashboard, Database, Sliders, RefreshCw, Layers } from "lucide-react";

interface Props {
  activeTab: "dashboard" | "works" | "upload" | "config";
  setActiveTab: (tab: "dashboard" | "works" | "upload" | "config") => void;
  onResetDemo: () => void;
  resetting: boolean;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onResetDemo,
  resetting,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Ministry/System Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600/20 border border-sky-500/30 text-sky-400 p-1.5 rounded">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm tracking-wider text-white">
                TRANSTRACK 2
              </span>
              <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                DEMO DATA — NOT OFFICIAL MPLADS DATA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              AI-Powered MPLADS Multi-Agent Risk & Audit Prioritization System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDemo}
            disabled={resetting}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded border border-slate-700 transition font-mono disabled:opacity-50"
            title="Reset database to fresh 250 demo works with seeded anomalies"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Resetting..." : "Reset Demo Data"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
            activeTab === "dashboard"
              ? "border-sky-500 text-sky-400 bg-sky-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Executive Dashboard
        </button>

        <button
          onClick={() => setActiveTab("works")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
            activeTab === "works"
              ? "border-sky-500 text-sky-400 bg-sky-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Risk Register & Works
        </button>

        <button
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
            activeTab === "upload"
              ? "border-sky-500 text-sky-400 bg-sky-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          Data Ingestion
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition ${
            activeTab === "config"
              ? "border-sky-500 text-sky-400 bg-sky-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Scoring Methodology
        </button>
      </nav>
    </header>
  );
};
