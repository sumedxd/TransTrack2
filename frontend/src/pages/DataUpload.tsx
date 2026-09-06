import React, { useState } from "react";
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, CheckCircle2, AlertCircle, Database, Sparkles } from "lucide-react";
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
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#625BE8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
            Ingestion Pipeline
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1 flex items-center gap-2">
          Dataset Ingestion & Gateway
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Ingest administrative work datasets in CSV, Excel (.xlsx), or JSON format with automatic schema normalization
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 font-semibold shadow-2xs ${
            statusMessage.type === "success"
              ? "bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534]"
              : "bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239]"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#16A66A]" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-[#F43F5E]" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Upload Box Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-xs space-y-5">
        <h3 className="text-sm font-extrabold text-[#1E293B] uppercase tracking-wider">
          Upload Work Records
        </h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#625BE8] rounded-3xl p-10 text-center bg-[#F8FAFC] transition cursor-pointer relative group">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] group-hover:bg-[#625BE8] text-[#625BE8] group-hover:text-white flex items-center justify-center mx-auto mb-3 transition-colors shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-[#1E293B]">
              {file ? file.name : "Click or drag & drop constituency files here to upload"}
            </p>
            <p className="text-xs text-[#64748B] mt-1 font-mono">
              Accepted formats: CSV, Excel (.xlsx, .xls), JSON
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <a
              href="/api/ingest/sample-template"
              download="mplads_demo_template.csv"
              className="inline-flex items-center gap-1.5 text-xs text-[#625BE8] font-bold hover:underline"
            >
              <Download className="w-4 h-4" />
              Download Standard Template CSV
            </a>

            <button
              type="submit"
              disabled={!file || uploading}
              className="flex items-center gap-2 bg-[#625BE8] hover:bg-[#4F46E5] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer"
            >
              {uploading && <RefreshCw className="w-4 h-4 animate-spin" />}
              {uploading ? "Analyzing Records..." : "Upload & Analyze Works"}
            </button>
          </div>
        </form>
      </div>

      {/* Restore Demo Dataset Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-[#1E293B]">Reset Baseline Demo Dataset</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Restores the verified 250 records across 5 states with seeded anomalies for evaluation
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="shrink-0 flex items-center gap-2 bg-[#16A66A] hover:bg-[#138A58] text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
          {resetting ? "Resetting..." : "Reset to 250 Demo Baseline"}
        </button>
      </div>

      {/* Schema Reference Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs text-xs space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1E293B]">
          Recognized Canonical Schema Attributes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 font-mono text-[11px]">
          {[
            "work_id", "mp_name", "constituency", "state", "district", "block", "village",
            "implementing_agency", "work_type", "work_description", "sanctioned_amount",
            "released_amount", "expenditure", "balance_amount", "work_status",
            "sanction_date", "completion_date", "financial_year", "latitude", "longitude"
          ].map((f) => (
            <div key={f} className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#1E293B]">
              <span className="font-bold text-[#625BE8]">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
