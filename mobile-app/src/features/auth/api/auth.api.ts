import apiClient from "../../../api/api-client";
import {
  LoginDto,
  AuthResponse,
  RegisterDto,
} from "../types/auth.types";

const normalizeAuthResponse = (payload: any): AuthResponse => {
  const profileUser =
    payload?.userId && payload?.email
      ? {
          id: payload.userId,
          email: payload.email,
          phone: payload.phone,
          isVerified: Boolean(payload?.isVerified ?? true),
          profile: payload.profile ?? null,
        }
      : null;

  const rawUser = payload?.data ?? profileUser;

  const user = rawUser
    ? {
      ...rawUser,
      fullName: rawUser.fullName || rawUser?.profile?.fullName,
    }
    : null;

  return {
    success:
      typeof payload?.success === "boolean"
        ? payload.success
        : Boolean(rawUser || payload?.status === "success"),
    accessToken: payload?.accessToken || payload?.token || "",
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

export const getMe = async (): Promise<AuthResponse> => {
  const response = await apiClient.get("/auth/profile");
  return normalizeAuthResponse(response.data);
};