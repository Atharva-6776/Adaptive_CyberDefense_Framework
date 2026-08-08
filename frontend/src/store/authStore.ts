import { create } from "zustand";

export interface User {
  id?: number;
  email: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })(),

  accessToken: localStorage.getItem("access_token"),

  refreshToken: localStorage.getItem("refresh_token"),

  isAuthenticated: !!localStorage.getItem("access_token"),

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({ user });
  },

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  initialize: () => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");

    if (userStr && token) {
      try {
        set({
          user: JSON.parse(userStr),
          accessToken: token,
          refreshToken: refresh,
          isAuthenticated: true,
        });
      } catch {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      }
    }
  },
}));