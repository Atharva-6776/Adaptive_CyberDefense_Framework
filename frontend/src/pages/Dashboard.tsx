import { Camera, Activity, TriangleAlert, Shield } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import CameraOverview from "../components/dashboard/CameraOverview";
import QuickActions from "../components/dashboard/QuickActions";
import SystemHealth from "../components/dashboard/SystemHealth";
import RecentActivity from "../components/dashboard/RecentActivity";

import {
  MOCK_CAMERAS,
  MOCK_ALERTS,
  MOCK_SYSTEM_HEALTH,
  MOCK_ACTIVITIES,
  MOCK_QUICK_ACTIONS,
} from "../data/dashboard";

export default function Dashboard() {
  const onlineCamerasCount = MOCK_CAMERAS.filter(
    (c) => c.status === "online"
  ).length;
  const activeAlertsCount = MOCK_ALERTS.filter(
    (a) => a.status === "active"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader />

      {/* 4 Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Cameras"
          value={MOCK_CAMERAS.length}
          subtitle="Surveillance endpoints"
          trend="+2 installed"
          trendPositive={true}
          icon={<Camera className="h-6 w-6 text-cyan-400" />}
        />

        <StatCard
          title="Online Cameras"
          value={onlineCamerasCount}
          subtitle={`${Math.round(
            (onlineCamerasCount / MOCK_CAMERAS.length) * 100
          )}% active uptime`}
          trend="Stable"
          trendPositive={true}
          icon={<Activity className="h-6 w-6 text-emerald-400" />}
        />

        <StatCard
          title="Active Alerts"
          value={activeAlertsCount}
          subtitle="Requires immediate review"
          trend="Critical priority"
          trendPositive={false}
          icon={<TriangleAlert className="h-6 w-6 text-amber-400" />}
        />

        <StatCard
          title="System Health"
          value={`${MOCK_SYSTEM_HEALTH.overallScore}%`}
          subtitle="MTD Dynamic Protection"
          trend="99.98% SLA"
          trendPositive={true}
          icon={<Shield className="h-6 w-6 text-emerald-400" />}
        />
      </div>

      {/* Quick Tactical Actions */}
      <QuickActions actions={MOCK_QUICK_ACTIONS} />

      {/* Middle Section: Recent Alerts & System Telemetry */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentAlerts alerts={MOCK_ALERTS} />
        </div>
        <div>
          <SystemHealth health={MOCK_SYSTEM_HEALTH} />
        </div>
      </div>

      {/* Bottom Section: Camera Overview & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CameraOverview cameras={MOCK_CAMERAS} />
        <RecentActivity activities={MOCK_ACTIVITIES} />
      </div>
    </div>
  );
}