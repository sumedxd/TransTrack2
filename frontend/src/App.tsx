import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar, type NavItem } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Investigation } from "./pages/Investigation";
import { MapPage } from "./pages/MapPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DataQualityPage } from "./pages/DataQualityPage";
import { DataUpload } from "./pages/DataUpload";
import { Settings } from "./pages/Settings";
import { fetchSummary } from "./services/api";

export function App() {
  const [activeItem, setActiveItem] = useState<NavItem>("overview");
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [priorityCount, setPriorityCount] = useState<number>(0);

  // Load summary metrics for sidebar badge indicators
  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await fetchSummary();
        setPriorityCount((s.critical_risk_count || 0) + (s.high_risk_count || 0));
      } catch (e) {
        // silent fail for sidebar badges
      }
    };
    loadStats();
  }, [refreshKey]);

  const handleSelectWork = (workId: string) => {
    setSelectedWorkId(workId);
  };

  const handleBackToDashboard = () => {
    setSelectedWorkId(null);
  };

  const handleNavigate = (item: NavItem) => {
    setSelectedWorkId(null);
    setActiveItem(item);
  };

  const handleDataChanged = () => {
    setRefreshKey((k) => k + 1);
    setSelectedWorkId(null);
    setActiveItem("overview");
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1E293B] flex flex-col font-sans">
      {/* Top Header: Title & Icon Only */}
      <Header />

      {/* Main App Layout: Sidebar + Main Content */}
      <div className="flex-1 flex w-full">
        <Sidebar
          activeItem={selectedWorkId ? "investigations" : activeItem}
          onSelect={(item) => {
            setSelectedWorkId(null);
            setActiveItem(item);
          }}
          priorityCount={priorityCount}
          qualityIssueCount={5}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {selectedWorkId ? (
            <Investigation
              workId={selectedWorkId}
              onBack={handleBackToDashboard}
              onSelectWork={handleSelectWork}
            />
          ) : (
            <>
              {activeItem === "overview" && (
                <Dashboard
                  key={refreshKey}
                  onSelectWork={handleSelectWork}
                  onNavigate={handleNavigate}
                  viewMode="overview"
                />
              )}
              {activeItem === "investigations" && (
                <Dashboard
                  key={`inv-${refreshKey}`}
                  onSelectWork={handleSelectWork}
                  onNavigate={handleNavigate}
                  initialRiskFilter="HIGH"
                  viewMode="investigations"
                />
              )}
              {activeItem === "map" && (
                <MapPage onSelectWork={handleSelectWork} />
              )}
              {activeItem === "analytics" && (
                <AnalyticsPage />
              )}
              {activeItem === "data-quality" && (
                <DataQualityPage onSelectWork={handleSelectWork} />
              )}
              {activeItem === "ingest" && (
                <DataUpload onUploadSuccess={handleDataChanged} />
              )}
              {activeItem === "methodology" && (
                <Settings onConfigSaved={handleDataChanged} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Clean Modern Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 text-center text-xs text-[#64748B] font-medium no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TransTrack 2 &bull; Decision-Support & Audit-Prioritization System</span>
          <span className="font-mono text-[#94A3B8]">Version 2.0.0 &bull; CAG Monitoring Prototype</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
