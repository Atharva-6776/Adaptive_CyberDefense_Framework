import { create } from "zustand";

interface User {
  id?: number;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (
    user: User,
    accessToken: string,
    refreshToken: string
  ) => void;

  logout: () => void;

  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  accessToken: localStorage.getItem("access_token"),

  refreshToken: localStorage.getItem("refresh_token"),

  isAuthenticated: !!localStorage.getItem("access_token"),

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
    localStorage.clear();

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  initialize: () => {
    const user = localStorage.getItem("user");

    if (user) {
      set({
        user: JSON.parse(user),
      });
    }
  },
}));