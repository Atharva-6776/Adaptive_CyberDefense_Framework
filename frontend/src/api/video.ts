import api from "./client";
import type { Camera } from "../types/dashboard";

export interface CameraInput {
  name: string;
  location: string;
  ip_address?: string;
  stream_url?: string;
  resolution?: string;
  fps?: number;
  stream_type?: string;
}

export const getCameras = async (): Promise<Camera[]> => {
  const response = await api.get("/api/v1/video/cameras");
  return response.data;
};

export const getCameraDetails = async (id: string | number): Promise<Camera> => {
  const response = await api.get(`/api/v1/video/cameras/${id}`);
  return response.data;
};

export const createCamera = async (data: CameraInput): Promise<Camera> => {
  const response = await api.post("/api/v1/video/cameras", data);
  return response.data;
};

export const updateCamera = async (id: string | number, data: Partial<CameraInput>): Promise<Camera> => {
  const response = await api.put(`/api/v1/video/cameras/${id}`, data);
  return response.data;
};

export const deleteCamera = async (id: string | number): Promise<void> => {
  await api.delete(`/api/v1/video/cameras/${id}`);
};

export const startCameraStream = async (id: string | number): Promise<{ message: string }> => {
  const response = await api.post(`/api/v1/video/cameras/${id}/start`);
  return response.data;
};

export const stopCameraStream = async (id: string | number): Promise<{ message: string }> => {
  const response = await api.post(`/api/v1/video/cameras/${id}/stop`);
  return response.data;
};
