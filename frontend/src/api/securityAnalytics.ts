import api from "./client";

export interface ThreatEvent {
  id: number;
  ip_address: string;
  event_type: string;
  source: string;
  severity: string;
  score: number;
  metadata_json?: string;
  created_at: string;
}

export interface ThreatScore {
  ip_address: string;
  current_score: number;
  threat_level: string;
  last_updated: string;
  active_block_id?: number;
}

export interface ThreatDetail {
  score: ThreatScore;
  events: ThreatEvent[];
}

export interface SecurityMetrics {
  active_blocks: number;
  critical_threats: number;
  honeypot_hits_24h: number;
  failed_logins_24h: number;
  average_threat_score: number;
  top_offending_ips: {
    ip_address: string;
    current_score: number;
    threat_level: string;
  }[];
}

export interface RecalculateResponse {
  recalculated: number;
  message: string;
}

export interface ThreatBlock {
  id: number;
  ip_address: string;
  reason?: string;
  threat_score: number;
  hit_count: number;
  first_seen: string;
  last_seen: string;
  blocked_at?: string;
  expires_at?: string;
  status: string;
}

export const getThreats = async (): Promise<ThreatScore[]> => {
  const response = await api.get("/api/v1/security/threats");
  return response.data;
};

export const getThreatDetail = async (ipAddress: string): Promise<ThreatDetail> => {
  const response = await api.get(`/api/v1/security/threats/${ipAddress}`);
  return response.data;
};

export const getSecurityMetrics = async (): Promise<SecurityMetrics> => {
  const response = await api.get("/api/v1/security/metrics");
  return response.data;
};

export const recalculateScores = async (): Promise<RecalculateResponse> => {
  const response = await api.post("/api/v1/security/recalculate");
  return response.data;
};

export const getBlocks = async (): Promise<ThreatBlock[]> => {
  const response = await api.get("/api/v1/security/blocks");
  return response.data;
};

export const manualBlockIp = async (ipAddress: string, reason?: string, durationMinutes = 60): Promise<ThreatBlock> => {
  const response = await api.post(`/api/v1/security/blocks/${ipAddress}/block`, {
    reason,
    duration_minutes: durationMinutes,
  });
  return response.data;
};

export const manualUnblockIp = async (ipAddress: string): Promise<ThreatBlock> => {
  const response = await api.post(`/api/v1/security/blocks/${ipAddress}/unblock`);
  return response.data;
};
