import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Activity,
  History,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getReports,
  getReportSummary,
  generateReport,
  getAuditLogs,
  type ReportItem,
  type ReportSummary,
  type ReportGenerateResponse,
  type AuditLogOut,
} from "../api/reports";

export default function Reports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeReportData, setActiveReportData] = useState<ReportGenerateResponse | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsData, summaryData, logsData] = await Promise.all([
        getReports(),
        getReportSummary(),
        getAuditLogs(),
      ]);
      setReports(reportsData);
      setSummary(summaryData);
      setAuditLogs(logsData);
    } catch (err: any) {
      console.error("Reports fetch error:", err);
      toast.error("Failed to load reports telemetry from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async (reportId: string, format: string = "JSON") => {
    try {
      setGeneratingId(reportId);
      const result = await generateReport({ report_type: reportId, format });
      setActiveReportData(result);
      setPreviewOpen(true);
      toast.success(`Generated '${result.title}' successfully.`);
      // Refresh audit logs
      const updatedLogs = await getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      console.error("Generate report error:", err);
      toast.error("Failed to generate report.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleExportDirect = async (reportId: string, format: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const baseURL = import.meta.env.VITE_API_URL || "";
      const exportUrl = `${baseURL}/api/v1/reports/export/${reportId}?format=${format}`;

      const res = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Export request failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportId}_report.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${reportId} report as ${format}`);
      const updatedLogs = await getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      toast.error(`Failed to export ${reportId} report.`);
    }
  };

  return (
    <div className="space-y-8 text-white min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Compliance & Security Reports
            </h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Backend Connected
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Automated compliance reporting, camera PPE violation logs, honeypot events & MTD telemetry.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary Telemetry Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Events</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {loading ? "..." : summary?.total_events ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Logged telemetry</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Honeypot Hits</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">
            {loading ? "..." : summary?.honeypot_hits_24h ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Decoy hits (24h)</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Blocks</span>
            <Lock className="h-4 w-4 text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {loading ? "..." : summary?.blocked_ips_count ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Blacklisted IPs</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {loading ? "..." : summary?.active_alerts_count ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Safety violations</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>MTD Rotations</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {loading ? "..." : summary?.mtd_rotations_count ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Dynamic path shuffles</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Audit Trail</span>
            <History className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-400">
            {loading ? "..." : summary?.total_audit_logs ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Admin action records</p>
        </div>
      </div>

      {/* Available Compilable Reports Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-400" />
          Automated Report Generators
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl hover:border-slate-700 transition space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                    {report.type}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{report.size}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{report.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3">{report.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => handleGenerateReport(report.id, "JSON")}
                  disabled={generatingId === report.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition disabled:opacity-50"
                >
                  {generatingId === report.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span>Generate & Preview Report</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportDirect(report.id, "JSON")}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => handleExportDirect(report.id, "CSV")}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Report Preview Modal */}
      {previewOpen && activeReportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{activeReportData.title}</h3>
                <p className="text-xs text-slate-400">
                  Generated: {activeReportData.generatedAt} | Format: {activeReportData.format}
                </p>
              </div>

              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Summary Metrics Pill list */}
            <div className="flex flex-wrap gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              {Object.entries(activeReportData.summary).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                  <span className="font-bold text-cyan-400">{String(v)}</span>
                </div>
              ))}
            </div>

            {/* Data Table / JSON View */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(activeReportData.data, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleExportDirect(activeReportData.id, "CSV")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Audit Logs Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Administrative Audit Trail</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {auditLogs.length} Records Logged
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No administrative audit actions recorded yet. Generate or export a report to see logs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-500">#{log.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {log.user_email}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-400 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{log.resource}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {log.details || "N/A"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{log.ip_address || "127.0.0.1"}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}