import api from "./client";

export interface PathRotationInfo {
  dynamic_path: string;
  target_handler: string;
  created_at: string;
  status: string;
}

export interface MTDStatusResponse {
  mtd_enabled: boolean;
  current_seed: string;
  active_routes: Record<string, string>;
  decoy_paths: string[];
  rotation_interval_seconds: number;
  last_rotation: string | null;
  next_rotation_in_seconds: number | null;
  rotation_history: PathRotationInfo[];
}

export const getMTDStatus = async (): Promise<MTDStatusResponse> => {
  const response = await api.get("/api/v1/mtd/status");
  return response.data;
};

export const triggerMTDRotation = async (): Promise<{ message: string; status: MTDStatusResponse }> => {
  const response = await api.post("/api/v1/mtd/rotate");
  return response.data;
};
