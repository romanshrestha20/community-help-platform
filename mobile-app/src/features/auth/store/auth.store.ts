import { create } from "zustand";
import { User } from "../types/auth.types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  verificationDeferred: boolean;
  login: (payload: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setUser: (user: User) => void;
  deferVerification: (deferred: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  verificationDeferred: false,

  login: ({ user, accessToken, refreshToken }) =>
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      verificationDeferred: false,
    }),

  setUser: (user) =>
    set((state) => ({
      user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
      verificationDeferred: state.verificationDeferred,
    })),

  deferVerification: (verificationDeferred) =>
    set((state) => ({
      ...state,
      verificationDeferred,
    })),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      verificationDeferred: false,
    }),
}));
