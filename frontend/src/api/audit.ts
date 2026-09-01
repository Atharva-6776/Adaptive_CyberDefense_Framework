import api from "./client";

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  resource: string;
  timestamp: string;
  result: string;
  metadata_json: string | null;
}

export interface AuditLogPaginated {
  items: AuditLog[];
  total: number;
  skip: number;
  limit: number;
}

export const getAuditLogs = async (skip = 0, limit = 100): Promise<AuditLogPaginated> => {
  const response = await api.get(`/api/v1/audit/logs?skip=${skip}&limit=${limit}`);
  return response.data;
};
