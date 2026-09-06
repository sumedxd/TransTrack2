import React, { useState, useEffect } from "react";
import { Sliders, Save, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
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
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-6 h-6 text-[#214E3B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b border-[#DDDDD7] pb-4">
        <h2 className="text-base font-bold text-[#202321] tracking-tight flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#214E3B]" />
          Audit Risk Scoring Methodology
        </h2>
        <p className="text-xs text-[#6B706B]">
          Adjust relative specialist agent weights and define policy risk tier cutoff thresholds
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-[6px] text-xs flex items-center gap-2 font-mono ${
            msg.type === "success"
              ? "bg-[#EEF5F0] border border-[#CCE0D2] text-[#235C3A]"
              : "bg-[#FCEEEE] border border-[#F3C1C1] text-[#992222]"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#235C3A]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#992222]" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 font-sans">
        {/* Agent Weights Card */}
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E4DE] pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#202321] uppercase tracking-wider">
                Specialist Agent Weight Contributions
              </h3>
              <p className="text-[11px] text-[#6B706B]">
                Linear combination weights for overall 0–100 Risk Priority Score
              </p>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                Math.abs(totalWeight - 1.0) < 0.01
                  ? "bg-[#EEF5F0] text-[#235C3A] border-[#CCE0D2]"
                  : "bg-[#FCEEEE] text-[#992222] border-[#F3C1C1]"
              }`}
            >
              Weight Sum: {(totalWeight * 100).toFixed(0)}% / 100%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#202321]">
                <span>Financial Agent Weight</span>
                <span className="font-mono text-[#214E3B]">
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
                className="w-full accent-[#214E3B]"
              />
              <p className="text-[11px] text-[#6B706B]">
                Budget overruns, utilization rate anomalies, locked balances, peer cost deviations
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#202321]">
                <span>Progress Agent Weight</span>
                <span className="font-mono text-[#214E3B]">
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
                className="w-full accent-[#214E3B]"
              />
              <p className="text-[11px] text-[#6B706B]">
                Execution delays beyond 365 days, brief completion velocity, status decoupling
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#202321]">
                <span>ML Anomaly Detection Weight</span>
                <span className="font-mono text-[#214E3B]">
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
                className="w-full accent-[#214E3B]"
              />
              <p className="text-[11px] text-[#6B706B]">
                Unsupervised Isolation Forest multi-feature outlier score, peer Z-score & percentiles
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#202321]">
                <span>Geographic Agent Weight</span>
                <span className="font-mono text-[#214E3B]">
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
                className="w-full accent-[#214E3B]"
              />
              <p className="text-[11px] text-[#6B706B]">
                Village fund concentration, executing agency monopoly within cluster, spatial density
              </p>
            </div>
          </div>
        </div>

        {/* Risk Tier Thresholds Card */}
        <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <h3 className="text-xs font-bold text-[#202321] uppercase tracking-wider border-b border-[#E5E4DE] pb-2">
            Risk Tier Cutoffs & Audit Directives
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-sans">
            <div className="bg-[#EEF5F0] border border-[#CCE0D2] p-3 rounded-[6px]">
              <span className="text-[#235C3A] font-bold block mb-1">
                LOW (0 &ndash; {config.threshold_low})
              </span>
              <p className="text-[11px] text-[#525752]">Action: Routine monitoring</p>
            </div>

            <div className="bg-[#FDF8EE] border border-[#EEDAA2] p-3 rounded-[6px]">
              <span className="text-[#8A5B00] font-bold block mb-1">
                MEDIUM ({config.threshold_low + 1} &ndash; {config.threshold_medium})
              </span>
              <p className="text-[11px] text-[#525752]">Action: Additional desk review</p>
            </div>

            <div className="bg-[#FDF4EE] border border-[#F4CFB7] p-3 rounded-[6px]">
              <span className="text-[#A84D17] font-bold block mb-1">
                HIGH ({config.threshold_medium + 1} &ndash; {config.threshold_high})
              </span>
              <p className="text-[11px] text-[#525752]">Action: Priority review</p>
            </div>

            <div className="bg-[#FCEEEE] border border-[#F3C1C1] p-3 rounded-[6px]">
              <span className="text-[#992222] font-bold block mb-1">
                CRITICAL ({config.threshold_high + 1} &ndash; 100)
              </span>
              <p className="text-[11px] text-[#525752]">Action: Priority physical verification</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#214E3B] hover:bg-[#173729] text-white text-xs font-semibold px-5 py-2.5 rounded-[6px] transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Updating Model..." : "Save Methodology & Re-score All Works"}
          </button>
        </div>
      </form>
    </div>
  );
};
