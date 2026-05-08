import apiClient from "@/api/api-client";
import { getRefreshToken } from "@/utils/token";
import type { LoginSession, SessionsResponse } from "../types/security.types";

const normalizeSessions = (payload: any): LoginSession[] => {
  const items = Array.isArray(payload?.data?.data)
    ? payload.data.data
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return items.filter(Boolean);
};

export const getLoginSessions = async (): Promise<SessionsResponse> => {
  const refreshToken = await getRefreshToken();
  const response = await apiClient.get("/auth/sessions", {
    headers: refreshToken
      ? { "x-session-refresh-token": refreshToken }
      : undefined,
  });

  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
    data: normalizeSessions(response),
  };
};

export const revokeLoginSession = async (sessionId: string) => {
  const refreshToken = await getRefreshToken();
  const response = await apiClient.delete(`/auth/sessions/${sessionId}`, {
    headers: refreshToken
      ? { "x-session-refresh-token": refreshToken }
      : undefined,
  });

  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};

export const logoutOtherSessions = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return {
      success: false,
      message: "Current session token is unavailable.",
    };
  }

  const response = await apiClient.delete("/auth/sessions", {
    data: { currentRefreshToken: refreshToken },
  });

  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || "",
  };
};
