import apiClient from "../../../api/api-client";
import { LoginDto, AuthResponse, RegisterDto } from "../types/auth.types";

const normalizeAuthResponse = (payload: any): AuthResponse => {
  console.log("[Auth API] Raw response payload:", JSON.stringify(payload, null, 2).slice(0, 200));

  const user = payload?.data
    ? {
      ...payload.data,
      fullName: payload.data.fullName || payload.data?.profile?.fullName,
    }
    : null;

  const normalized = {
    success: Boolean(payload?.success) || payload?.status === "success",
    token: payload?.accessToken || payload?.token || "",
    refreshToken: payload?.refreshToken || "",
    data: user,
    message: payload?.message || "",
  } as AuthResponse;

  console.log("[Auth API] Normalized response:", { success: normalized.success, hasToken: !!normalized.token, hasRefreshToken: !!normalized.refreshToken });

  return normalized;
};

export const login = async (credentials: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/login", credentials);
  return normalizeAuthResponse(response.data);
};

export const register = async (credentials: RegisterDto): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/register", credentials);
  return normalizeAuthResponse(response.data);
};


export const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/change-password", { currentPassword, newPassword });
  return normalizeAuthResponse(response.data);
}