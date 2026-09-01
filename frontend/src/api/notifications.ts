import api from "./client";

export interface NotificationLog {
  id: number;
  event_type: string;
  recipient_channel: string;
  status: string;
  timestamp: string;
  failure_reason?: string | null;
  reference_id?: string | null;
}

export interface NotificationConfig {
  global_dispatch_enabled: boolean;
  cooldown_seconds: number;
  providers: {
    email: {
      enabled: boolean;
      configured: boolean;
    };
    slack: {
      enabled: boolean;
      configured: boolean;
    };
  };
}

export const getNotificationLogs = async (): Promise<NotificationLog[]> => {
  const response = await api.get("/api/v1/notifications/logs");
  return response.data;
};

export const getNotificationConfig = async (): Promise<NotificationConfig> => {
  const response = await api.get("/api/v1/notifications/config");
  return response.data;
};
