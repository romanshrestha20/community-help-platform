import apiClient from "../../../api/api-client";
import {
  LoginDto,
  AuthResponse,
  RegisterDto,
  GoogleLoginDto,
} from "../types/auth.types";

const normalizeAuthResponse = (payload: any): AuthResponse => {
  const rawUser = payload?.data || payload?.user || null;

  const user = rawUser
    ? {
        ...rawUser,
        fullName: rawUser.fullName || rawUser?.profile?.fullName,
      }
    : null;

  return {
    success: Boolean(payload?.success) || payload?.status === "success",
    token: payload?.accessToken || payload?.token || "",
    refreshToken: payload?.refreshToken || "",
    data: user,
    message: payload?.message || "",
  };
};

export const login = async (credentials: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/login", credentials);
  return normalizeAuthResponse(response.data);
};

export const register = async (
  credentials: RegisterDto
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/register", credentials);
  return normalizeAuthResponse(response.data);
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return normalizeAuthResponse(response.data);
};

export const googleLogin = async (
  credentials: GoogleLoginDto
): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/google", credentials);
  return normalizeAuthResponse(response.data);
};