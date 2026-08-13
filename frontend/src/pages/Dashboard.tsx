import { useEffect, useState } from "react";
import { Shield, RefreshCw, Server, UserCheck } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import CameraOverview from "../components/dashboard/CameraOverview";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import { useAuthStore } from "../store/authStore";
import { getMTDStatus, type MTDStatusResponse } from "../api/mtd";
import { getCameras } from "../api/video";
import { getAlerts } from "../api/alerts";
import type { Camera, Alert } from "../types/dashboard";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [mtdStatus, setMtdStatus] = useState<MTDStatusResponse | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [statusData, cameraData, alertData] = await Promise.all([
        getMTDStatus(),
        getCameras(),
        getAlerts(),
      ]);
      setMtdStatus(statusData);
      setCameras(cameraData);
      setAlerts(alertData);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError("Backend connection error or unauthenticated");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh metrics every 5 seconds for real-time surveillance feel
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-w-0 space-y-8 text-white">
      {/* Header */}
      <DashboardHeader onRefresh={fetchDashboardData} />

      {/* Dynamic Alert Banner if backend is unreachable */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
          <Server className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}. Please check if the backend API service is running.</span>
        </div>
      )}

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

      {/* Live Video Analytics and Alert Panels */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CameraOverview cameras={cameras} />
        <RecentAlerts alerts={alerts} />
      </div>
    </div>
  );
}