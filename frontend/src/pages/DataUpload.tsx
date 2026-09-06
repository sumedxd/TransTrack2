import React, { useState } from "react";
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadDataset, resetToDemo } from "../services/api";

interface Props {
  onUploadSuccess: () => void;
}

export const DataUpload: React.FC<Props> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setStatusMessage(null);
      const res = await uploadDataset(file);
      setStatusMessage({
        type: "success",
        text: `Successfully ingested and analyzed ${res.total_processed} works from '${res.filename}'. Multi-agent pipeline updated.`,
      });
      setFile(null);
      onUploadSuccess();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to process uploaded file.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setStatusMessage(null);
      const res = await resetToDemo();
      setStatusMessage({
        type: "success",
        text: `${res.message} Fresh 250 demo records re-loaded with verified anomalies.`,
      });
      onUploadSuccess();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to reset demo dataset.",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b border-[#DDDDD7] pb-4">
        <h2 className="text-base font-bold text-[#202321] tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#214E3B]" />
          MPLADS Ingestion Layer & Dataset Gateway
        </h2>
        <p className="text-xs text-[#6B706B]">
          Ingest administrative work datasets in CSV, Excel (.xlsx), or JSON format with automatic schema normalization
        </p>
      </div>

      {/* Notice regarding Official MOSPI eSAKSHI Portal */}
      <div className="bg-[#FAF9F5] border-l-3 border-l-[#214E3B] border-y border-r border-[#DDDDD7] p-4 rounded-r-[6px] text-xs text-[#525752] leading-relaxed">
        <strong className="font-bold text-[#202321] block mb-1">
          Administrative Integration Notice: Official MOSPI eSAKSHI Portal
        </strong>
        The public MOSPI MPLADS eSAKSHI dashboard relies on dynamic authenticated session tables without open unauthenticated REST endpoints. In strict accordance with audit verification principles, TransTrack 2 provides this structured ingestion pipeline to import official constituency records without brittle scrapers.
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-[6px] text-xs flex items-center gap-2 font-mono ${
            statusMessage.type === "success"
              ? "bg-[#EEF5F0] border border-[#CCE0D2] text-[#235C3A]"
              : "bg-[#FCEEEE] border border-[#F3C1C1] text-[#992222]"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#235C3A]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#992222]" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Upload Box Card */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h3 className="text-xs font-bold text-[#202321] uppercase tracking-wider">
          Upload Work Records
        </h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-[#DDDDD7] hover:border-[#214E3B] rounded-[8px] p-8 text-center bg-[#FAF9F5] transition cursor-pointer relative">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-8 h-8 text-[#6B706B] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#202321]">
              {file ? file.name : "Click or drag & drop files here to upload"}
            </p>
            <p className="text-[11px] text-[#6B706B] mt-1 font-mono">
              Accepted formats: CSV, Excel (.xlsx, .xls), JSON
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href="/api/ingest/sample-template"
              download="mplads_demo_template.csv"
              className="inline-flex items-center gap-1.5 text-xs text-[#214E3B] font-semibold hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              Download Standard Template CSV
            </a>

            <button
              type="submit"
              disabled={!file || uploading}
              className="flex items-center gap-2 bg-[#214E3B] hover:bg-[#173729] text-white text-xs font-semibold px-4 py-2 rounded-[6px] transition disabled:opacity-40"
            >
              {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? "Analyzing Records..." : "Upload & Analyze Works"}
            </button>
          </div>
        </form>
      </div>

      {/* Restore Demo Dataset Card */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#202321]">Reset Baseline Demo Dataset</h3>
          <p className="text-xs text-[#6B706B] mt-0.5">
            Restores the verified 250 records across 5 states with seeded anomalies for evaluation
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="shrink-0 flex items-center gap-1.5 bg-[#FAF9F5] hover:bg-[#EAE8E2] text-[#202321] border border-[#DDDDD7] text-xs px-3.5 py-2 rounded-[6px] font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#214E3B] ${resetting ? "animate-spin" : ""}`} />
          {resetting ? "Resetting..." : "Reset to Demo Dataset"}
        </button>
      </div>

      {/* Schema Reference Table */}
      <div className="bg-white border border-[#DDDDD7] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#202321]">
          Recognized Canonical Schema Attributes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 font-mono text-[11px]">
          {[
            "work_id", "mp_name", "constituency", "state", "district", "block", "village",
            "implementing_agency", "work_type", "work_description", "sanctioned_amount",
            "released_amount", "expenditure", "balance_amount", "work_status",
            "sanction_date", "completion_date", "financial_year", "latitude", "longitude"
          ].map((f) => (
            <div key={f} className="p-2 bg-[#FAF9F5] rounded border border-[#E5E4DE] text-[#202321]">
              <span className="font-semibold text-[#214E3B]">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
