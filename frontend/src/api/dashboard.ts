import api from "./client";

export interface DashboardMetrics {
  total_cameras: number;
  online_cameras: number;
  active_alerts: number;
  system_health: string;
}

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await api.get("/video/metrics");
  return response.data;
};