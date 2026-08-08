import { useEffect, useState } from "react";
import { Shield, RefreshCw, Server, AlertCircle, UserCheck } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { useAuthStore } from "../store/authStore";
import { getMTDStatus, type MTDStatusResponse } from "../api/mtd";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [mtdStatus, setMtdStatus] = useState<MTDStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const data = await getMTDStatus();
      setMtdStatus(data);
    } catch (err: any) {
      setError("Backend connection error or unauthenticated");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="w-full min-w-0 space-y-8 text-white">
      {/* Header */}
      <DashboardHeader onRefresh={fetchStatus} />

      {/* Real Information Cards — 4-col on xl, 2-col on md, 1-col on mobile */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Authenticated User */}
        <StatCard
          title="Authenticated User"
          value={user?.email || "Unknown user"}
          subtitle={`Role: ${user?.role || "N/A"}`}
          trend="Authenticated"
          trendPositive={true}
          icon={<UserCheck className="h-5 w-5 text-cyan-400" />}
        />

        {/* MTD Dynamic Defense Status */}
        <StatCard
          title="MTD Defense"
          value={loading ? "Loading…" : mtdStatus?.mtd_enabled ? "Enabled" : "Disabled"}
          subtitle={
            mtdStatus
              ? `Rotation: ${mtdStatus.rotation_interval_seconds}s`
              : "MTD status pending"
          }
          trend={mtdStatus?.mtd_enabled ? "Active Shuffling" : "Inactive"}
          trendPositive={!!mtdStatus?.mtd_enabled}
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
        />

        {/* Backend Availability */}
        <StatCard
          title="Backend Connection"
          value={error ? "Disconnected" : "Connected"}
          subtitle="FastAPI Core Engine"
          trend={error ? "Error" : "Online"}
          trendPositive={!error}
          icon={<Server className="h-5 w-5 text-indigo-400" />}
        />

        {/* Dynamic Routes Count */}
        <StatCard
          title="Active Dynamic Routes"
          value={mtdStatus ? Object.keys(mtdStatus.active_routes).length : 0}
          subtitle="Protected MTD Endpoints"
          trend="Dynamic Translation"
          trendPositive={true}
          icon={<RefreshCw className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Backend Integration Pending Modules — equal-height grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Camera Surveillance Module Notice */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          {/* Card header */}
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="flex min-w-0 shrink items-center gap-2 text-sm font-bold text-white">
              <Server className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="truncate">Camera Surveillance Engine</span>
            </h3>
            <span className="inline-flex shrink-0 items-center rounded-full border border-amber-500/20 bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 whitespace-nowrap">
              Pending
            </span>
          </div>

          {/* Empty-state body – flex-1 so both panels grow to the same height */}
          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-800/80 bg-slate-950/50 p-8 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">
              Video endpoints are not configured on the backend.
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Real camera streaming &amp; AI video analytics will be enabled when
              backend video endpoints are deployed.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[10px] font-mono font-semibold text-amber-400">
              Backend integration pending
            </span>
          </div>
        </div>

        {/* Alert Telemetry Module Notice */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          {/* Card header */}
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="flex min-w-0 shrink items-center gap-2 text-sm font-bold text-white">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="truncate">Alert &amp; Incident Telemetry</span>
            </h3>
            <span className="inline-flex shrink-0 items-center rounded-full border border-amber-500/20 bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 whitespace-nowrap">
              Pending
            </span>
          </div>

          {/* Empty-state body */}
          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-800/80 bg-slate-950/50 p-8 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">
              Alerts service endpoint pending integration.
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Real security events and honeypot intrusion triggers will be
              displayed here when live alert APIs are linked.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[10px] font-mono font-semibold text-amber-400">
              Backend integration pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}