import React, { useState, useEffect } from "react";
import { Sliders, Save, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Scale } from "lucide-react";
import type { WeightConfig } from "../types";
import { fetchConfig, updateConfig } from "../services/api";

interface Props {
  onConfigSaved: () => void;
}

export const Settings: React.FC<Props> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState<WeightConfig>({
    weight_financial: 0.30,
    weight_progress: 0.25,
    weight_anomaly: 0.25,
    weight_geographic: 0.20,
    threshold_low: 30.0,
    threshold_medium: 60.0,
    threshold_high: 80.0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await fetchConfig();
        setConfig(c);
      } catch (e) {
        console.error("Failed to load config", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalWeight =
    config.weight_financial +
    config.weight_progress +
    config.weight_anomaly +
    config.weight_geographic;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setMsg({
        type: "error",
        text: `Weights must sum to 100% (currently ${(totalWeight * 100).toFixed(0)}%).`,
      });
      return;
    }

    try {
      setSaving(true);
      setMsg(null);
      await updateConfig(config);
      setMsg({
        type: "success",
        text: "Scoring methodology updated! Re-calculated risk scores across all works.",
      });
      onConfigSaved();
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.message || "Failed to update configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#625BE8] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#64748B]">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#625BE8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
            System Calibration
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1 flex items-center gap-2">
          Audit Risk Scoring Methodology
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Adjust relative specialist agent weights and define policy risk tier cutoff thresholds
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 font-semibold shadow-2xs ${
            msg.type === "success"
              ? "bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534]"
              : "bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239]"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-[#16A66A] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#F43F5E] shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agent Weights Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#1E293B]">
                Specialist Agent Weight Contributions
              </h3>
              <p className="text-xs text-[#64748B]">
                Linear combination weights for overall 0–100 Risk Priority Score
              </p>
            </div>
            <span
              className={`text-xs font-mono font-extrabold px-3 py-1.5 rounded-xl border ${
                Math.abs(totalWeight - 1.0) < 0.01
                  ? "bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]"
                  : "bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]"
              }`}
            >
              Weight Sum: {(totalWeight * 100).toFixed(0)}% / 100%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-[#FFF7ED] p-5 rounded-2xl border border-[#FFEDD5] space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#EA580C]">
                <span>Financial Agent Weight</span>
                <span className="font-mono text-sm font-extrabold">
                  {(config.weight_financial * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={config.weight_financial}
                onChange={(e) =>
                  setConfig({ ...config, weight_financial: parseFloat(e.target.value) })
                }
                className="w-full accent-[#F5A20A] cursor-pointer"
              />
              <p className="text-[11px] text-[#9A3412] leading-tight">
                Budget overruns, utilization rate anomalies, locked balances, peer cost deviations
              </p>
            </div>

            <div className="bg-[#F5F3FF] p-5 rounded-2xl border border-[#EDE9FE] space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#625BE8]">
                <span>Progress Agent Weight</span>
                <span className="font-mono text-sm font-extrabold">
                  {(config.weight_progress * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={config.weight_progress}
                onChange={(e) =>
                  setConfig({ ...config, weight_progress: parseFloat(e.target.value) })
                }
                className="w-full accent-[#625BE8] cursor-pointer"
              />
              <p className="text-[11px] text-[#4F46E5] leading-tight">
                Execution delays beyond 365 days, brief completion velocity, status decoupling
              </p>
            </div>

            <div className="bg-[#FFF1F2] p-5 rounded-2xl border border-[#FFE4E6] space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#E11D48]">
                <span>ML Anomaly Detection Weight</span>
                <span className="font-mono text-sm font-extrabold">
                  {(config.weight_anomaly * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={config.weight_anomaly}
                onChange={(e) =>
                  setConfig({ ...config, weight_anomaly: parseFloat(e.target.value) })
                }
                className="w-full accent-[#F43F5E] cursor-pointer"
              />
              <p className="text-[11px] text-[#BE123C] leading-tight">
                Unsupervised Isolation Forest multi-feature outlier score, peer Z-score & percentiles
              </p>
            </div>

            <div className="bg-[#F0FDFA] p-5 rounded-2xl border border-[#CCFBF1] space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#0D9488]">
                <span>Geographic Agent Weight</span>
                <span className="font-mono text-sm font-extrabold">
                  {(config.weight_geographic * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={config.weight_geographic}
                onChange={(e) =>
                  setConfig({ ...config, weight_geographic: parseFloat(e.target.value) })
                }
                className="w-full accent-[#16B8A6] cursor-pointer"
              />
              <p className="text-[11px] text-[#115E59] leading-tight">
                Village fund concentration, executing agency monopoly within cluster, spatial density
              </p>
            </div>
          </div>
        </div>

        {/* Risk Tier Thresholds Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-[#1E293B] border-b border-[#F1F5F9] pb-3">
            Risk Tier Cutoffs & Audit Directives
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-sans">
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] p-4 rounded-2xl">
              <span className="text-[#15803D] font-extrabold block mb-1">
                LOW (0 &ndash; {config.threshold_low})
              </span>
              <p className="text-[11px] text-[#166534] font-medium">Action: Routine monitoring</p>
            </div>

            <div className="bg-[#FEFCE8] border border-[#FEF08A] p-4 rounded-2xl">
              <span className="text-[#A16207] font-extrabold block mb-1">
                MEDIUM ({config.threshold_low + 1} &ndash; {config.threshold_medium})
              </span>
              <p className="text-[11px] text-[#854D0E] font-medium">Action: Additional desk review</p>
            </div>

            <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-4 rounded-2xl">
              <span className="text-[#EA580C] font-extrabold block mb-1">
                HIGH ({config.threshold_medium + 1} &ndash; {config.threshold_high})
              </span>
              <p className="text-[11px] text-[#9A3412] font-medium">Action: Priority desk audit</p>
            </div>

            <div className="bg-[#FFF1F2] border border-[#FFE4E6] p-4 rounded-2xl">
              <span className="text-[#E11D48] font-extrabold block mb-1">
                CRITICAL ({config.threshold_high + 1} &ndash; 100)
              </span>
              <p className="text-[11px] text-[#9F1239] font-medium">Action: Priority physical verification</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#16A66A] hover:bg-[#138A58] text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Recalibrating Pipeline..." : "Save Methodology & Re-score All Works"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
