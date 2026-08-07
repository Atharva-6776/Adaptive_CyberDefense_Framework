import { useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { MOCK_ALERTS } from "../data/dashboard";
import type { Alert, AlertSeverity, AlertStatus } from "../types/dashboard";
import { toast } from "sonner";

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"timestamp" | "severity">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Handle local state resolution
  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: "resolved" } : alert
      )
    );
    toast.success(`Alert ${id} has been marked as resolved.`);
  };

  // Severity ranking for sorting
  const severityWeight: Record<AlertSeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filtering
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.camera.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;

    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Sorting
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === "timestamp") {
      return sortOrder === "desc"
        ? b.rawTimestamp - a.rawTimestamp
        : a.rawTimestamp - b.rawTimestamp;
    } else {
      const weightA = severityWeight[a.severity];
      const weightB = severityWeight[b.severity];
      return sortOrder === "desc" ? weightB - weightA : weightA - weightB;
    }
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "medium":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
      case "low":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "investigating":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "active":
      default:
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Security Incident & Alerts Log
            </h1>
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-0.5 text-xs font-semibold text-rose-400">
              {alerts.filter((a) => a.status === "active").length} Active Alerts
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time cyber defense intrusion triggers, visual anomaly logs & incident mitigation.
          </p>
        </div>
      </div>

      {/* Filter, Search & Sort controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts, cameras, descriptions..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Sort option */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white"
            title="Toggle sort order"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "timestamp" | "severity")}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="timestamp">Sort by Time ({sortOrder.toUpperCase()})</option>
            <option value="severity">Sort by Severity ({sortOrder.toUpperCase()})</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Alert ID & Title</th>
                <th className="px-6 py-4 font-bold">Severity</th>
                <th className="px-6 py-4 font-bold">Camera & Location</th>
                <th className="px-6 py-4 font-bold">Timestamp</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sortedAlerts.length > 0 ? (
                sortedAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="transition hover:bg-slate-850/60"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="font-mono text-[11px] text-cyan-400 font-semibold">
                          {alert.id}
                        </span>
                        <h4 className="font-bold text-white text-sm">
                          {alert.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {alert.description}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-white">{alert.camera}</p>
                        <p className="text-[11px] text-slate-400">{alert.location}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {alert.timestamp}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-semibold text-[11px] ${getStatusBadge(
                          alert.status
                        )}`}
                      >
                        {alert.status === "resolved" && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {alert.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {alert.status !== "resolved" ? (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShieldAlert className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                    <p className="font-bold text-slate-400">No alerts match criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}