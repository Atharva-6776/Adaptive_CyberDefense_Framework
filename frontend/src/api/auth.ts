import api from "./client";
import { getMTDStatus } from "./mtd";
import { useAuthStore, type User } from "../store/authStore";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const resolveDynamicRoute = async (targetHandler: string): Promise<string> => {
  try {
    const mtdStatus = await getMTDStatus();
    if (mtdStatus.mtd_enabled && mtdStatus.active_routes) {
      const dynamicRoute = Object.keys(mtdStatus.active_routes).find(
        (route) => mtdStatus.active_routes[route] === targetHandler
      );
      if (dynamicRoute) {
        return dynamicRoute;
      }
    }
  } catch (err) {
    console.warn("Could not fetch MTD status for dynamic route resolution, falling back to target handler", err);
  }
  return targetHandler;
};

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await api.post("/api/v1/auth/login", data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const dynamicPath = await resolveDynamicRoute("/api/v1/auth/me");
  const response = await api.get(dynamicPath);
  return response.data;
};

export const logoutApi = async (): Promise<void> => {
  const refreshToken = localStorage.getItem("refresh_token");
  try {
    const dynamicPath = await resolveDynamicRoute("/api/v1/auth/logout");
    if (refreshToken) {
      await api.post(dynamicPath, { refresh_token: refreshToken });
    }
  } catch (err) {
    console.error("Logout API error:", err);
  } finally {
    useAuthStore.getState().logout();
  }
};