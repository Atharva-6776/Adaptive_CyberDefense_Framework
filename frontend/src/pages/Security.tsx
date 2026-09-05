import { useEffect, useState } from "react";
import {
  Shield,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
  Lock,
  Layers,
  Eye,
} from "lucide-react";
import { getMTDStatus, triggerMTDRotation, type MTDStatusResponse } from "../api/mtd";
import { getHoneypotLogs, type HoneypotLogEntry } from "../api/security";

export default function Security() {
  const [mtdStatus, setMtdStatus] = useState<MTDStatusResponse | null>(null);
  const [honeypotLogs, setHoneypotLogs] = useState<HoneypotLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rotateMessage, setRotateMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const [statusData, logsData] = await Promise.all([
        getMTDStatus(),
        getHoneypotLogs(),
      ]);
      setMtdStatus(statusData);
      setHoneypotLogs(logsData);
    } catch (err: any) {
      setError("Failed to fetch live MTD status from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRotation = async () => {
    setIsRotating(true);
    setRotateMessage(null);
    try {
      const res = await triggerMTDRotation();
      setMtdStatus(res.status);
      setRotateMessage(res.message || "MTD address space rotated successfully!");
    } catch (err: any) {
      setError("Rotation failed: " + (err?.response?.data?.detail || err.message));
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Adaptive Cyber Security & MTD Command
            </h1>
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                mtdStatus?.mtd_enabled
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }`}
            >
              {mtdStatus?.mtd_enabled ? "ACTIVE DEFENSE ENABLED" : "DEFENSE INACTIVE"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time Moving Target Defense (MTD) route shuffling, dynamic address space translation & decoy telemetry.
          </p>
        </div>

        <button
          onClick={handleManualRotation}
          disabled={isRotating || loading}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-cyan-950/40"
        >
          <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
          Rotate MTD Address Space
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {rotateMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{rotateMessage}</span>
        </div>
      )}

      {/* Real MTD Status KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* MTD Operational Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              MTD Status
            </span>
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold tracking-tight text-white">
              {loading ? "Loading..." : mtdStatus?.mtd_enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Seed: <span className="font-mono text-cyan-400">{mtdStatus?.current_seed || "N/A"}</span>
          </p>
        </div>

        {/* Rotation Interval */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rotation Interval
            </span>
            <RefreshCw className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {mtdStatus ? `${mtdStatus.rotation_interval_seconds}s` : "N/A"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Automated cycle period</p>
        </div>

        {/* Next Rotation Countdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Next Rotation In
            </span>
            <Layers className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-amber-400">
              {mtdStatus?.next_rotation_in_seconds != null
                ? `${Math.round(mtdStatus.next_rotation_in_seconds)}s`
                : "N/A"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Last: {mtdStatus?.last_rotation ? new Date(mtdStatus.last_rotation).toLocaleTimeString() : "N/A"}
          </p>
        </div>

        {/* Dynamic Protection Coverage */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Dynamic Routes
            </span>
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {mtdStatus ? Object.keys(mtdStatus.active_routes).length : 0}
            </span>
            <span className="text-xs font-semibold text-slate-400">Protected</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {mtdStatus?.decoy_paths.length || 0} Decoy Traps Deployed
          </p>
        </div>
      </div>

      {/* Active Dynamic Route Registry Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              Active Dynamic Route Mappings
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">REAL BACKEND MAPPING</span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading dynamic routes...</p>
        ) : mtdStatus?.active_routes && Object.keys(mtdStatus.active_routes).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Dynamic Path (Client facing)</th>
                  <th className="py-3 px-4">Target Handler (Protected)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Object.entries(mtdStatus.active_routes).map(([dynPath, target]) => (
                  <tr key={dynPath} className="hover:bg-slate-800/30 font-mono">
                    <td className="py-3 px-4 text-cyan-400 font-bold">{dynPath}</td>
                    <td className="py-3 px-4 text-slate-300">{target}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No active dynamic routes found.</p>
        )}
      </div>

      {/* Decoy Paths & Honeypots */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Configured Decoy Paths (Honeypots)
          </h3>
          {mtdStatus?.decoy_paths && mtdStatus.decoy_paths.length > 0 ? (
            <ul className="space-y-2">
              {mtdStatus.decoy_paths.map((path) => (
                <li
                  key={path}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono"
                >
                  <span className="text-amber-400 font-medium">{path}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    HONEYPOT TRAP
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No decoy paths active.</p>
          )}
        </div>

        {/* Recent Path Rotation History */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            Rotation History
          </h3>
          {mtdStatus?.rotation_history && mtdStatus.rotation_history.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {mtdStatus.rotation_history.map((hist, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950 p-3 text-xs font-mono"
                >
                  <div>
                    <p className="text-cyan-400 font-semibold">{hist.dynamic_path}</p>
                    <p className="text-slate-500 text-[10px]">
                      Target: {hist.target_handler}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        hist.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {hist.status}
                    </span>
                    <p className="text-slate-500 text-[10px] mt-1">
                      {new Date(hist.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No rotation history recorded yet.</p>
          )}
        </div>
      </div>

      {/* Honeypot Telemetry Log Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Honeypot Intrusion Telemetry</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{honeypotLogs.length} EVENTS</span>
        </div>

        {honeypotLogs.length > 0 ? (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Decoy Path</th>
                  <th className="py-2.5 px-3">Source IP</th>
                  <th className="py-2.5 px-3">User-Agent</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {honeypotLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 font-mono">
                    <td className="py-2.5 px-3 text-rose-400 font-bold">{log.decoy_path_triggered}</td>
                    <td className="py-2.5 px-3 text-slate-300">{log.ip_address}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-[200px] truncate">{log.user_agent || "N/A"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No honeypot intrusion events recorded yet.</p>
        )}
      </div>
    </div>
  );
}
