import apiClient from "../../../api/api-client";
import { LoginDto, AuthResponse, RegisterDto } from "../types/auth.types";

const normalizeAuthResponse = (payload: any): AuthResponse => {
  const user = payload?.data
    ? {
      ...payload.data,
      fullName: payload.data.fullName || payload.data?.profile?.fullName,
    }
    : null;

  return {
    success: Boolean(payload?.success),
    token: payload?.token || "",
    data: user,
    message: payload?.message || "",
  } as AuthResponse;
};

export const login = async (credentials: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/login", credentials);
  return normalizeAuthResponse(response.data);
};

export const register = async (credentials: RegisterDto): Promise<AuthResponse> => {
  const response = await apiClient.post("/auth/register", credentials);
  return normalizeAuthResponse(response.data);
};
