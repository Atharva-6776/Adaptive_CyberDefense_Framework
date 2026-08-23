import api from "./client";

export interface UserProfileSettings {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
  criticalOnly: boolean;
  recipientEmail?: string;
}

export interface SecurityPreferences {
  threatDetectionWindowSec: number;
  honeypotThreshold: number;
  blockDurationSec: number;
  autoBlockHighRisk: boolean;
  maxFailedLoginAttempts: number;
}

export interface MTDConfigSettings {
  mtd_enabled: boolean;
  rotation_interval_seconds: number;
  decoy_paths_count: number;
  seed_configured: boolean;
}

export interface ApiConfigSettings {
  apiKey: string;
  endpoint: string;
  rateLimit: string;
  corsOrigins: string[];
}

export interface AppearanceSettings {
  theme: string;
  compactView: boolean;
  autoRefresh: boolean;
  refreshIntervalSec: number;
}

export interface AppInfoSettings {
  name: string;
  version: string;
  environment: string;
  uptime: string;
}

export interface SystemSettingsResponse {
  profile: UserProfileSettings;
  notifications: NotificationSettings;
  security: SecurityPreferences;
  mtd: MTDConfigSettings;
  api: ApiConfigSettings;
  appearance: AppearanceSettings;
  app: AppInfoSettings;
}

export interface SystemSettingsUpdate {
  notifications?: Partial<NotificationSettings>;
  security?: Partial<SecurityPreferences>;
  mtd_enabled?: boolean;
  mtd_rotation_interval_seconds?: number;
  appearance?: Partial<AppearanceSettings>;
}

export const getSettings = async (): Promise<SystemSettingsResponse> => {
  const response = await api.get("/api/v1/settings");
  return response.data;
};

export const updateSettings = async (
  data: SystemSettingsUpdate
): Promise<SystemSettingsResponse> => {
  const response = await api.put("/api/v1/settings", data);
  return response.data;
};
