import { useEffect, useState } from "react";
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Target,
  ShieldBan,
  Skull,
  TrendingUp,
} from "lucide-react";
import {
  getSecurityMetrics,
  getThreats,
  recalculateScores,
  getBlocks,
  manualBlockIp,
  manualUnblockIp,
  type SecurityMetrics,
  type ThreatScore,
  type ThreatBlock,
} from "../api/securityAnalytics";
import { getNotificationLogs, type NotificationLog } from "../api/notifications";
import { getAuditLogs, type AuditLog } from "../api/audit";
import { useAuthStore } from "../store/authStore";

export default function ThreatAnalytics() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [threats, setThreats] = useState<ThreatScore[]>([]);
  const [blocks, setBlocks] = useState<ThreatBlock[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [metricsData, threatsData, blocksData, logsData, auditData] = await Promise.all([
        getSecurityMetrics(),
        getThreats(),
        getBlocks(),
        isAdmin ? getNotificationLogs() : Promise.resolve([]),
        isAdmin ? getAuditLogs(0, 100) : Promise.resolve({ items: [], total: 0, skip: 0, limit: 100 }),
      ]);
      setMetrics(metricsData);
      setThreats(threatsData);
      setBlocks(blocksData);
      setNotificationLogs(logsData);
      setAuditLogs((auditData as any).items || []);
    } catch (err: any) {
      setError("Failed to load threat analytics data from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRecalculate = async () => {
    if (!isAdmin) return;
    setIsRecalculating(true);
    setRecalcMessage(null);
    try {
      const res = await recalculateScores();
      setRecalcMessage(res.message);
      await fetchData();
    } catch (err: any) {
      setError("Failed to recalculate scores: " + (err?.response?.data?.detail || err.message));
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleBlock = async (ip: string) => {
    if (!isAdmin) return;
    try {
      await manualBlockIp(ip, "Manual admin block", 60);
      await fetchData();
    } catch (err: any) {
      setError("Failed to block IP: " + (err?.response?.data?.detail || err.message));
    }
  };

  const handleUnblock = async (ip: string) => {
    if (!isAdmin) return;
    try {
      await manualUnblockIp(ip);
      await fetchData();
    } catch (err: any) {
      setError("Failed to unblock IP: " + (err?.response?.data?.detail || err.message));
    }
  };

  const getThreatColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "CRITICAL":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "HIGH":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Threat Analytics
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Adaptive risk correlation and IP scoring engine.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating || loading}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-cyan-950/40"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`} />
            Recalculate Scores
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {recalcMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2">
          <Activity className="h-4 w-4 shrink-0" />
          <span>{recalcMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Blocks
            </span>
            <ShieldBan className="h-5 w-5 text-red-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {loading ? "-" : metrics?.active_blocks ?? 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Currently blocked IPs</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Critical Threats
            </span>
            <Skull className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-rose-500">
              {loading ? "-" : metrics?.critical_threats ?? 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">IPs flagged CRITICAL</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Honeypot Hits (24h)
            </span>
            <Target className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {loading ? "-" : metrics?.honeypot_hits_24h ?? 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Decoy interactions</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Failed Logins (24h)
            </span>
            <ShieldAlert className="h-5 w-5 text-orange-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {loading ? "-" : metrics?.failed_logins_24h ?? 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Auth brute force attempts</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg Threat Score
            </span>
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-cyan-400">
              {loading ? "-" : metrics?.average_threat_score ?? 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">System-wide risk baseline</p>
        </div>
      </div>

      {/* Top Offending IPs Table */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-12 rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">
                Active Threat Scores (All IPs)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {threats.length} TRACKED
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading threat scores...</p>
          ) : threats.length > 0 ? (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Threat Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Last Updated</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {threats.map((threat) => (
                    <tr key={threat.ip_address} className="hover:bg-slate-800/30 font-mono">
                      <td className="py-3 px-4 text-cyan-400 font-bold">{threat.ip_address}</td>
                      <td className="py-3 px-4 text-slate-300 font-bold">
                        {threat.current_score.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getThreatColor(
                            threat.threat_level
                          )}`}
                        >
                          {threat.threat_level}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {threat.active_block_id ? (
                          <span className="flex w-fit items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500 border border-red-500/20">
                            <ShieldBan className="h-3 w-3" />
                            BLOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold">MONITORING</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {new Date(threat.last_updated).toLocaleString()}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          {threat.active_block_id ? (
                            <button
                              onClick={() => handleUnblock(threat.ip_address)}
                              className="rounded bg-emerald-600/20 px-2 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-600/40"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(threat.ip_address)}
                              className="rounded bg-red-600/20 px-2 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-600/40"
                            >
                              Block
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No active threats tracked.</p>
          )}
        </div>
      </div>

      {/* Block History Table */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-12 rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-bold text-white">
                IP Blocklist History
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {blocks.length} RECORDS
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading blocks...</p>
          ) : blocks.length > 0 ? (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Expires / Unblocked</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {blocks.map((block) => (
                    <tr key={block.id} className="hover:bg-slate-800/30 font-mono">
                      <td className="py-3 px-4 text-red-400 font-bold">{block.ip_address}</td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]">{block.reason || "N/A"}</td>
                      <td className="py-3 px-4">
                        {block.status === "blocked" ? (
                          <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500 border border-red-500/20 uppercase">
                            BLOCKED
                          </span>
                        ) : block.status === "expired" ? (
                          <span className="rounded bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-500/20 uppercase">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">
                            UNBLOCKED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {block.status === "blocked" && block.expires_at 
                          ? new Date(block.expires_at).toLocaleString() 
                          : block.status === "unblocked" 
                            ? "Manual Unblock" 
                            : "N/A"}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          {block.status === "blocked" ? (
                            <button
                              onClick={() => handleUnblock(block.ip_address)}
                              className="rounded bg-emerald-600/20 px-2 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-600/40"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(block.ip_address)}
                              className="rounded bg-red-600/20 px-2 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-600/40"
                            >
                              Block
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No blocks recorded.</p>
          )}
        </div>
      </div>

      {/* Notification Logs Table */}
      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-12 rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">
                  Dispatch & Notification Logs
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {notificationLogs.length} LOGS
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading notification logs...</p>
            ) : notificationLogs.length > 0 ? (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reference ID</th>
                      <th className="py-3 px-4">Failure Reason</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {notificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 font-mono">
                        <td className="py-3 px-4 text-indigo-400 font-bold">{log.event_type}</td>
                        <td className="py-3 px-4 text-slate-300 uppercase">{log.recipient_channel}</td>
                        <td className="py-3 px-4">
                          {log.status === "success" ? (
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">
                              SUCCESS
                            </span>
                          ) : log.status === "skipped_cooldown" ? (
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase">
                              COOLDOWN
                            </span>
                          ) : (
                            <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20 uppercase">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{log.reference_id || "-"}</td>
                        <td className="py-3 px-4 text-rose-400 truncate max-w-[200px]">{log.failure_reason || "-"}</td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No dispatch logs recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-12 mt-6">
          <div className="lg:col-span-12 rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-fuchsia-400" />
                <h2 className="text-lg font-bold text-white">
                  Audit Logs
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {auditLogs.length} LOGS
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading audit logs...</p>
            ) : auditLogs.length > 0 ? (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Resource</th>
                      <th className="py-3 px-4">Result</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 font-mono">
                        <td className="py-3 px-4 text-fuchsia-400 font-bold uppercase">{log.action}</td>
                        <td className="py-3 px-4 text-slate-300">{log.user_id || "System"}</td>
                        <td className="py-3 px-4 text-slate-400">{log.resource}</td>
                        <td className="py-3 px-4">
                          {log.result === "success" ? (
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">
                              SUCCESS
                            </span>
                          ) : (
                            <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20 uppercase">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No audit logs recorded.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
