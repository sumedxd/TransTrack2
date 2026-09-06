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
import { resetToDemo, fetchSummary } from "./services/api";

export function App() {
  const [activeItem, setActiveItem] = useState<NavItem>("overview");
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
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

  const handleResetDemo = async () => {
    if (!window.confirm("Restore the verified 250 baseline demo records with seeded anomalies?")) {
      return;
    }
    try {
      setResetting(true);
      await resetToDemo();
      setSelectedWorkId(null);
      setRefreshKey((k) => k + 1);
      alert("Baseline dataset successfully restored.");
    } catch (e: any) {
      alert(`Reset failed: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleDataChanged = () => {
    setRefreshKey((k) => k + 1);
    setSelectedWorkId(null);
    setActiveItem("overview");
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#202321] flex flex-col font-sans">
      {/* Institutional Top Header */}
      <Header onResetDemo={handleResetDemo} resetting={resetting} />

      {/* Desktop Analytics Body: Sidebar + Main Content */}
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
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {selectedWorkId ? (
            <Investigation
              workId={selectedWorkId}
              onBack={handleBackToDashboard}
              onSelectWork={handleSelectWork}
            />
          ) : (
            <>
              {activeItem === "overview" && (
                <Dashboard key={refreshKey} onSelectWork={handleSelectWork} />
              )}
              {activeItem === "works" && (
                <Dashboard key={refreshKey} onSelectWork={handleSelectWork} />
              )}
              {activeItem === "investigations" && (
                <Dashboard key={refreshKey} onSelectWork={handleSelectWork} />
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

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-[#DDDDD7] py-3 text-center text-xs text-[#6B706B] font-mono no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TransTrack 2 &bull; Decision-Support & Audit-Prioritization System</span>
          <span>Version 2.0.0 &bull; CAG Monitoring Prototype</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
