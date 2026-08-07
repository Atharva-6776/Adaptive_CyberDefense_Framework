import { useState } from "react";
import { Download, Calendar, FileText, Plus, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { MOCK_REPORTS } from "../data/dashboard";
import type { ReportItem } from "../types/dashboard";
import { toast } from "sonner";

export default function Reports() {
  const [reports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [reportType, setReportType] = useState<string>("Security Audit");

  const handleDownload = (title: string, format: string) => {
    toast.success(`Downloading ${title} (${format})...`);
  };

  const handleGenerateCustomReport = (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Generating dynamic ${reportType} report...`,
        success: `${reportType} compiled successfully and ready for export.`,
        error: "Failed to generate report",
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Compliance & Security Reports
            </h1>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-xs font-semibold text-cyan-400">
              AUDIT READY
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Export cyber defense telemetry logs, camera violation metrics & MTD rotation analytics.
          </p>
        </div>
      </div>

      {/* Available Generated Reports */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-400" />
          Recent Generated Audit Reports
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm transition hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-cyan-400">
                    {report.id}
                  </span>
                  <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                    {report.format} • {report.size}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-white">
                  {report.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {report.generatedAt}
                </span>

                <button
                  onClick={() => handleDownload(report.title, report.format)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 font-semibold text-white transition hover:border-cyan-500 hover:bg-cyan-600 active:scale-95"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future & Automated Reports Generator Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">
            Custom Report & Automated Schedule Generator
          </h2>
        </div>

        <form onSubmit={handleGenerateCustomReport} className="mt-6 grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Report Category
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Security Audit">Weekly Comprehensive Security Audit</option>
              <option value="Incident Log">24-Hour Intrusion Incident Summary</option>
              <option value="Camera Performance">Surveillance Camera Hardware Metrics</option>
              <option value="MTD Analytics">Moving Target Defense IP Rotation Log</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Date Range
            </label>
            <input
              type="date"
              defaultValue="2026-08-01"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-950/40"
            >
              <Plus className="h-4 w-4" />
              Generate & Dispatch Report
            </button>
          </div>
        </form>

        {/* Scheduled Automation Info */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 text-xs">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-bold text-white">Automated Weekly Dispatch Active</p>
              <p className="text-slate-400">PDF audit reports are automatically compiled every Sunday at 00:00 UTC.</p>
            </div>
          </div>
          <span className="mt-2 sm:mt-0 inline-flex items-center gap-1 font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            SCHEDULED
          </span>
        </div>
      </div>
    </div>
  );
}