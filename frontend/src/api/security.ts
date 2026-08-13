import api from "./client";

export interface HoneypotLogEntry {
  id: number;
  decoy_path_triggered: string;
  ip_address: string;
  user_agent?: string;
  timestamp: string;
  headers_logged: Record<string, string>;
}

export const getHoneypotLogs = async (): Promise<HoneypotLogEntry[]> => {
  const response = await api.get("/api/v1/mtd/honeypot/logs");
  return response.data;
};
